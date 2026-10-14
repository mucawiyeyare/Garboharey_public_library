import { User } from '../models/User.js'
import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import mongoose from 'mongoose'
import { z } from 'zod'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { Book } from '../models/Book.js'
import { Copy } from '../models/BookCopy.js'
import { Loan } from '../models/Borrowing.js'
import { Reservation } from '../models/Reservation.js'
import { getPolicy } from '../models/Fine.js'
import { dueDateFor } from '../services/borrowingService.js'
import { idSchema } from '../validators/bookValidator.js'

export const getList = async (req, res) => {
  const page = pagination(req, 250)
  const isStaff = req.user && ['librarian', 'admin', 'director'].includes(req.user.role)
  const search = textSearch(req.query.q)

  let statusFilter = {}
  if (req.query.status && req.query.status !== 'all') {
    if (req.query.status === 'accepted' || req.query.status === 'approved') {
      statusFilter = { status: { $in: ['accepted', 'approved'] } }
    } else {
      statusFilter = { status: req.query.status }
    }
  }

  const memberFilter = !isStaff && req.user ? { member: req.user.id } : {}
  const searchFilter = search
    ? {
        $or: [
          { borrowerName: search },
          { phone: search },
          { notes: search },
        ],
      }
    : {}

  const filter = {
    ...statusFilter,
    ...memberFilter,
    ...searchFilter,
  }

  const [items, total] = await Promise.all([
    Reservation.find(filter)
      .populate('book', 'title author coverId isbn genre')
      .populate('member', 'name email role')
      .populate('copies', 'barcode shelf status')
      .populate('loan')
      .sort({ createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Reservation.countDocuments(filter),
  ])

  sendPage(res, items, total, page)
}

export const postList = async (req, res) => {
  const body = {
    ...req.body,
    name: req.body?.name || req.body?.borrowerName,
    numberOfCopies: Number(req.body?.numberOfCopies || req.body?.copiesNeeded || 1),
  }
  const input = z
    .object({
      bookId: idSchema,
      name: z.string().trim().min(1, 'Borrower Name is required'),
      phone: z.string().trim().min(1, 'Telephone number is required'),
      numberOfCopies: z.number().int().min(1, 'At least 1 copy must be requested'),
      notes: z.string().trim().optional().default(''),
      returnDate: z.coerce
        .date({ errorMap: () => ({ message: 'Return date is required' }) })
        .refine((date) => date > new Date(), 'Return date must be in the future')
        .refine(
          (date) => date < new Date(Date.now() + 366 * 86400000),
          'Return date must be within one year',
        ),
    })
    .parse(body)

  return mongoose.connection.transaction(async (session) => {
    // 1. Verify book exists and is not archived
    const book = requireRecord(
      await Book.findOne({ _id: input.bookId, archived: false }).session(session),
      'This title is not available for reservation',
    )

    // 2. Prevent duplicate pending reservation for same book by borrower
    const pendingFilter = {
      book: input.bookId,
      status: 'pending',
      $or: [
        { phone: input.phone },
        ...(req.user?.id ? [{ member: req.user.id }] : []),
      ],
    }
    const existingPending = await Reservation.findOne(pendingFilter).session(session)
    if (existingPending) {
      throw new ApiError(
        409,
        'Your reservation has already been sent to the Admin and Librarian. Please wait for approval.',
      )
    }

    // 3. Find available copies to reserve
    const availableCopies = await Copy.find({ book: input.bookId, status: 'available' })
      .limit(input.numberOfCopies)
      .session(session)

    if (availableCopies.length < input.numberOfCopies) {
      throw new ApiError(
        400,
        availableCopies.length === 0
          ? 'No copies are currently available for reservation.'
          : `Only ${availableCopies.length} copy/copies currently available for reservation.`,
      )
    }

    const copyIds = availableCopies.map((c) => c._id)

    // 4. Mark requested copies as 'reserved' so no other borrower can take them
    await Copy.updateMany(
      { _id: { $in: copyIds } },
      { $set: { status: 'reserved' } },
      { session },
    )

    // 5. Create reservation record with Pending status
    const [hold] = await Reservation.create(
      [
        {
          book: input.bookId,
          member: req.user?.id || req.user?._id || null,
          borrowerName: input.name,
          phone: input.phone,
          numberOfCopies: input.numberOfCopies,
          copies: copyIds,
          status: 'pending',
          notes: input.notes,
          returnDate: input.returnDate,
        },
      ],
      { session },
    )

    await Audit.create(
      [
        {
          actor: req.user?.id || hold._id,
          action: 'reservation.created',
          entity: String(hold._id),
        },
      ],
      { session },
    )

    res.status(201).json({
      message: 'Your reservation has been sent to the Admin and Librarian. Please wait for approval.',
      reservation: hold,
    })
  })
}

// Admin / Librarian accepts reservation -> status becomes Accepted, automatically added to Circulation List
export const postApprove = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  return mongoose.connection.transaction(async (session) => {
    const hold = requireRecord(
      await Reservation.findById(id).session(session),
      'Reservation not found',
    )

    if (hold.status === 'accepted' || hold.status === 'approved') {
      return res.json({ message: 'Reservation has already been accepted.', reservation: hold })
    }

    const policy = await getPolicy()
    // The borrower's requested return date is the due date; otherwise the loan policy applies.
    const requested = hold.returnDate ? new Date(hold.returnDate) : null
    if (requested) requested.setUTCHours(23, 59, 59, 999)
    const dueAt = requested && requested > new Date() ? requested : dueDateFor(null, policy)

    // Ensure copies transition to on_loan
    if (hold.copies?.length) {
      await Copy.updateMany(
        { _id: { $in: hold.copies } },
        { $set: { status: 'on_loan' } },
        { session },
      )
    }

    // Automatically create circulation record
    const [loan] = await Loan.create(
      [
        {
          book: hold.book,
          copy: hold.copies?.[0] || null,
          copies: hold.copies || [],
          numberOfCopies: hold.numberOfCopies || hold.copies?.length || 1,
          borrowerName: hold.borrowerName,
          phone: hold.phone,
          borrowerType: hold.member ? 'member' : 'regular',
          member: hold.member || null,
          borrowingDate: new Date(),
          dueAt,
          returnedAt: null,
          source: 'reservation',
          status: 'active',
          reservation: hold._id,
          processedBy: req.user.id,
        },
      ],
      { session },
    )

    hold.status = 'accepted'
    hold.ready = true
    hold.readyAt = new Date()
    hold.loan = loan._id
    await hold.save({ session })

    await Audit.create(
      [
        {
          actor: req.user.id,
          action: 'reservation.accepted',
          entity: String(hold._id),
        },
        {
          actor: req.user.id,
          action: 'loan.created_from_reservation',
          entity: String(loan._id),
        },
      ],
      { session },
    )

    await Book.updateOne({ _id: hold.book }, { $inc: { circulationVersion: 1 } }, { session })

    res.json({
      message: 'Reservation accepted. Record automatically added to Circulation List.',
      reservation: hold,
      loan,
    })
  })
}

// Admin / Librarian rejects reservation -> status becomes Rejected, copies returned to available
export const postReject = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  return mongoose.connection.transaction(async (session) => {
    const hold = requireRecord(
      await Reservation.findById(id).session(session),
      'Reservation not found',
    )

    // Return the reserved copies back to available
    if (hold.copies?.length) {
      await Copy.updateMany(
        { _id: { $in: hold.copies } },
        { $set: { status: 'available' } },
        { session },
      )
    }

    // If a loan was already created, mark returned/cancelled
    if (hold.loan) {
      await Loan.updateOne(
        { _id: hold.loan },
        { $set: { returnedAt: new Date(), status: 'returned', outcome: 'lost' } },
        { session },
      )
    }

    hold.status = 'rejected'
    hold.ready = false
    await hold.save({ session })

    await Audit.create(
      [{ actor: req.user.id, action: 'reservation.rejected', entity: String(hold._id) }],
      { session },
    )

    await Book.updateOne({ _id: hold.book }, { $inc: { circulationVersion: 1 } }, { session })

    res.json({
      message: 'Reservation rejected. Copies returned to available pool.',
      reservation: hold,
    })
  })
}

export const postIdCancel = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  return mongoose.connection.transaction(async (session) => {
    const hold = requireRecord(
      await Reservation.findById(id).session(session),
      'Reservation not found',
    )

    if (['pending', 'waiting'].includes(hold.status) && hold.copies?.length) {
      await Copy.updateMany(
        { _id: { $in: hold.copies } },
        { $set: { status: 'available' } },
        { session },
      )
    }

    hold.status = 'cancelled'
    await hold.save({ session })

    await Audit.create(
      [{ actor: req.user?.id || hold._id, action: 'reservation.cancelled', entity: id }],
      { session },
    )

    res.status(204).end()
  })
}
