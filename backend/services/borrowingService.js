import mongoose from 'mongoose'
import { Audit } from '../models/AuditLog.js'
import { Book } from '../models/Book.js'
import { Copy } from '../models/BookCopy.js'
import { Loan } from '../models/Borrowing.js'
import { Notification } from '../models/Notification.js'
import { Reservation } from '../models/Reservation.js'
import { User } from '../models/User.js'
import { getPolicy, Fine } from '../models/Fine.js'
import { notice, queueEmail } from './notificationService.js'
import { computeFine } from './fineService.js'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'

export async function markNextReady(bookId, session) {
  if (!(await Copy.exists({ book: bookId, status: 'available' }).session(session))) return null
  const hold = await Reservation.findOne({
    book: bookId,
    status: 'waiting',
    ready: false,
  })
    .sort({ createdAt: 1, _id: 1 })
    .session(session)
  if (!hold) return null
  if (
    await Reservation.exists({
      book: bookId,
      status: 'waiting',
      ready: true,
    }).session(session)
  )
    return null
  const policy = await getPolicy()
  hold.ready = true
  hold.readyAt = new Date()
  hold.expiresAt =
    policy.reservationHoldDays > 0
      ? new Date(Date.now() + policy.reservationHoldDays * 86400000)
      : null
  await hold.save({ session })
  const book = await Book.findById(bookId).session(session)
  const ready = notice('reservationReady', { title: book?.title })
  await Notification.create([{ member: hold.member, ...ready }], { session })
  const reader = await User.findById(hold.member).session(session)
  if (reader?.emailVerified)
    await queueEmail(reader.email, 'Your reserved title is ready', ready.message, { session })
  return hold
}

// `returnDate` (YYYY-MM-DD) is the date the librarian picked; without it the policy's
// loan period applies. The borrow time itself is always set by the system.
export function dueDateFor(returnDate, policy, now = new Date()) {
  if (!returnDate) return new Date(now.getTime() + policy.loanDays * 86400000)
  // Due at the end of the chosen day (East Africa Time, UTC+3).
  const due = new Date(`${returnDate}T23:59:59+03:00`)
  if (!Number.isFinite(due.getTime()) || due.toISOString().slice(0, 10) > returnDate)
    throw new ApiError(400, 'Choose a valid return date.')
  if (due <= now) throw new ApiError(400, 'The return date must be after today.')
  if (due.getTime() - now.getTime() > 365 * 86400000)
    throw new ApiError(400, 'The return date must be within one year.')
  return due
}
export async function issueLoan(borrowerInput, copyId, actorId, returnDate) {
  const policy = await getPolicy()
  const dueAt = dueDateFor(returnDate, policy)

  const isObject = typeof borrowerInput === 'object' && borrowerInput !== null
  const memberId = isObject ? borrowerInput.memberId : borrowerInput
  const borrowerType = isObject ? borrowerInput.borrowerType || 'regular' : 'member'
  let borrowerName = isObject ? (borrowerInput.borrowerName || '').trim() : ''
  let phone = isObject ? (borrowerInput.phone || '').trim() : ''

  return mongoose.connection.transaction(async (session) => {
    let member = null
    if (memberId) {
      member = await User.findById(memberId).session(session)
      if (member) {
        if (!borrowerName) borrowerName = member.name
        if (!phone) phone = member.phone || ''
        await User.updateOne({ _id: member._id }, { $inc: { circulationVersion: 1 } }, { session })

        if (
          (await Loan.countDocuments({
            member: member._id,
            returnedAt: null,
          }).session(session)) >= policy.maxLoans
        )
          throw new ApiError(409, 'This member has reached the borrowing limit')
        if (
          await Loan.exists({
            member: member._id,
            returnedAt: null,
            dueAt: { $lt: new Date() },
          }).session(session)
        )
          throw new ApiError(409, 'Return overdue books before borrowing again')
      }
    }

    if (!borrowerName) {
      throw new ApiError(400, 'Borrower name is required')
    }
    if (!phone) {
      throw new ApiError(400, 'Telephone number is required')
    }

    const copiesInput = [...new Set((Array.isArray(copyId) ? copyId : [copyId]).map(String))]
    const copy = requireRecord(
      await Copy.findOne({ _id: copiesInput[0] }).session(session),
      'This copy is unavailable',
    )
    // Every copy must be on the shelf and belong to the same title.
    const ready = await Copy.countDocuments({
      _id: { $in: copiesInput },
      book: copy.book,
      status: 'available',
    }).session(session)
    if (ready !== copiesInput.length)
      throw new ApiError(
        409,
        copiesInput.length === 1
          ? 'This copy is not available.'
          : 'Some of the selected copies are not available. Refresh and try again.',
      )
    await Copy.updateMany(
      { _id: { $in: copiesInput } },
      { $set: { status: 'on_loan' } },
      { session },
    )
    const book = requireRecord(
      await Book.findOneAndUpdate(
        { _id: copy.book, archived: false },
        { $inc: { circulationVersion: 1 } },
        { session, returnDocument: 'after' },
      ),
      'This title is archived',
    )

    const [loan] = await Loan.create(
      [
        {
          borrowerName,
          phone,
          borrowerType,
          member: member ? member._id : null,
          copy: copiesInput[0],
          copies: copiesInput,
          numberOfCopies: copiesInput.length,
          book: book._id,
          borrowingDate: new Date(),
          dueAt,
          source: borrowerInput.source || 'admin',
          status: 'active',
          processedBy: actorId,
        },
      ],
      { session },
    )
    await Audit.create([{ actor: actorId, action: 'loan.issued', entity: String(loan._id) }], {
      session,
    })

    if (member) {
      await Notification.create(
        [
          {
            member: member._id,
            ...notice('borrowed', {
              title: book.title,
              due: loan.dueAt.toISOString().slice(0, 10),
            }),
          },
        ],
        { session },
      )
      if (member.emailVerified) {
        await queueEmail(
          member.email,
          'Your library loan',
          `You borrowed ${book.title}. Due ${loan.dueAt.toISOString().slice(0, 10)}.`,
          { session },
        )
      }
    }
    return loan
  })
}
const copyStatusFor = { good: 'available', damaged: 'damaged', lost: 'lost' }
export async function returnLoan(loanId, actorId, { condition = 'good', notes = '' } = {}) {
  const policy = await getPolicy()
  return mongoose.connection.transaction(async (session) => {
    const returnedAt = new Date()
    const loan = requireRecord(
      await Loan.findOneAndUpdate(
        { _id: loanId, returnedAt: null },
        {
          $set: {
            returnedAt,
            returnCondition: condition,
            returnNotes: notes,
            processedBy: actorId,
            outcome: condition === 'lost' ? 'lost' : 'returned',
          },
        },
        { session, returnDocument: 'after' },
      ),
      'Active loan not found',
    )
    // Return all copies of this circulation record back to available
    const copyIds = [
      ...(loan.copies && loan.copies.length ? loan.copies : []),
      ...(loan.copy ? [loan.copy] : []),
    ]
    if (copyIds.length) {
      await Copy.updateMany(
        { _id: { $in: copyIds } },
        { $set: { status: copyStatusFor[condition] || 'available' } },
        { session },
      )
    }
    // A late return creates a fine only when the library has configured fines.
    const { late, amount } = computeFine(loan.dueAt, policy, returnedAt)
    let fine = null
    if (amount > 0) {
      ;[fine] = await Fine.create(
        [
          {
            member: loan.member ?? null,
            borrowerName: loan.borrowerName ?? '',
            phone: loan.phone ?? '',
            loan: loan._id,
            amount,
            daysOverdue: late,
          },
        ],
        { session },
      )
      await Audit.create([{ actor: actorId, action: 'fine.recorded', entity: String(fine._id) }], {
        session,
      })
      if (loan.member)
        await Notification.create(
          [
            {
              member: loan.member,
              ...notice('fineRecorded', {
                amount,
                currency: policy.currency,
                days: late,
              }),
            },
          ],
          { session },
        )
    }
    await Book.updateOne({ _id: loan.book }, { $inc: { circulationVersion: 1 } }, { session })
    if (loan.member) {
      await User.updateOne({ _id: loan.member }, { $inc: { circulationVersion: 1 } }, { session })
    }
    await markNextReady(loan.book, session)
    await Audit.create(
      [
        {
          actor: actorId,
          action: condition === 'lost' ? 'loan.lost' : 'loan.returned',
          entity: loanId,
        },
      ],
      { session },
    )
    if (loan.member) {
      const reader = await User.findById(loan.member).session(session)
      if (reader?.emailVerified)
        await queueEmail(
          reader.email,
          'Library return recorded',
          'Your book return has been recorded. Thank you.',
          { session },
        )
    }
    return { ...loan.toObject(), fine: fine?.toObject() ?? null, late }
  })
}
export async function renewLoan(loanId, actorId, options = {}) {
  const policy = await getPolicy()
  const { updatedDueDate, dueDate, memberOnly } =
    typeof options === 'object' && options !== null ? options : { memberOnly: options }
  return mongoose.connection.transaction(async (session) => {
    const loan = requireRecord(
      await Loan.findOne({
        _id: loanId,
        returnedAt: null,
        ...(memberOnly ? { member: actorId } : {}),
      }).session(session),
      'Active loan not found',
    )
    await Book.updateOne({ _id: loan.book }, { $inc: { circulationVersion: 1 } }, { session })

    let nextDueDate
    const requestedDateStr = updatedDueDate || dueDate
    if (requestedDateStr) {
      nextDueDate = new Date(`${requestedDateStr}T23:59:59+03:00`)
      if (isNaN(nextDueDate.getTime())) {
        throw new ApiError(400, 'Invalid updated due date provided.')
      }
    } else {
      nextDueDate = new Date(loan.dueAt.getTime() + (policy.renewalDays || 14) * 86400000)
    }

    loan.dueAt = nextDueDate
    loan.renewals = (loan.renewals || 0) + 1
    // A new due date gets its own "borrowing time ended" notice later.
    loan.overdueNotifiedAt = null
    loan.status = 'active'
    await loan.save({ session })
    await Audit.create([{ actor: actorId, action: 'loan.renewed', entity: loanId }], { session })
    if (loan.member) {
      const reader = await User.findById(loan.member).session(session)
      if (reader?.emailVerified)
        await queueEmail(
          reader.email,
          'Library loan renewed',
          `Your loan was renewed. New due date: ${loan.dueAt.toISOString().slice(0, 10)}.`,
          { session },
        )
    }
    return loan
  })
}
