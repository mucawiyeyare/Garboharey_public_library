import { pagination, sendPage } from '../utils/pagination.js'
import { isAdmin } from '../middleware/authMiddleware.js'
import { z } from 'zod'
import { Loan } from '../models/Borrowing.js'
import { Audit } from '../models/AuditLog.js'
import { getPolicy } from '../models/Fine.js'
import { computeFine, daysLate } from '../services/fineService.js'
import { requireRecord } from '../middleware/errorMiddleware.js'
import { idSchema } from '../validators/bookValidator.js'
import { issueLoan, renewLoan, returnLoan } from '../services/borrowingService.js'
// End of the current day in East Africa Time (UTC+3), the library's time zone.
function endOfToday() {
  const local = new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10)
  return new Date(`${local}T23:59:59.999+03:00`)
}
export const getList = async (req, res) => {
  const page = pagination(req, 250)
  const filter = {
    ...(req.user.role === 'member' || req.query.scope === 'mine' ? { member: req.user.id } : {}),
    ...(req.query.status === 'active'
      ? { returnedAt: null }
      : req.query.status === 'returned'
        ? { returnedAt: { $ne: null } }
        : req.query.status === 'overdue'
          ? { returnedAt: null, dueAt: { $lt: new Date() } }
          : req.query.status === 'due-today'
            ? { returnedAt: null, dueAt: { $gte: new Date(), $lte: endOfToday() } }
            : {}),
  }
  const policy = await getPolicy()
  const [rows, total] = await Promise.all([
    Loan.find(filter)
      .populate('book', 'title author isbn')
      .populate('member', 'name email phone')
      .populate('copy', 'barcode shelf')
      .populate('copies', 'barcode shelf')
      .sort({ createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Loan.countDocuments(filter),
  ])
  // Overdue loans carry their days late and the fine they would incur if returned now.
  const items = rows.map((loan) => {
    const isReturned = !!loan.returnedAt
    const isOverdue = !isReturned && new Date(loan.dueAt) < new Date()
    return {
      ...loan,
      status: isReturned ? 'returned' : isOverdue ? 'overdue' : 'active',
      numberOfCopies: loan.numberOfCopies || (loan.copies?.length || 1),
      borrowingDate: loan.borrowingDate || loan.createdAt,
      source: loan.source || 'admin',
      daysOverdue: isOverdue ? daysLate(loan.dueAt) : 0,
      projectedFine: isOverdue ? computeFine(loan.dueAt, policy).amount : 0,
    }
  })
  sendPage(res, items, total, page)
}
export const postList = async (req, res) => {
  const input = z
    .object({
      borrowerName: z.string().trim().min(1, 'Borrower name is required').optional(),
      name: z.string().trim().optional(),
      phone: z.string().trim().min(1, 'Telephone number is required').optional(),
      telephone: z.string().trim().optional(),
      borrowerType: z.enum(['regular', 'member', 'librarian', 'admin']).default('regular'),
      memberId: idSchema.optional().nullable(),
      // One copy, or several copies of the same title borrowed together
      copyId: z.union([idSchema, z.array(idSchema).min(1).max(50)]),
      numberOfCopies: z.number().int().min(1).optional().default(1),
      returnDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    })
    .parse(req.body)

  const finalName = (input.borrowerName || input.name || '').trim()
  const finalPhone = (input.phone || input.telephone || '').trim()

  const borrowerInput = {
    borrowerName: finalName,
    phone: finalPhone,
    borrowerType: input.borrowerType,
    memberId: input.memberId,
    source: isAdmin(req.user) ? 'admin' : 'librarian',
    numberOfCopies: input.numberOfCopies,
  }

  res.status(201).json(await issueLoan(borrowerInput, input.copyId, req.user.id, input.returnDate))
}
export const postIdReturn = async (req, res) => {
  const input = z
    .object({
      condition: z.enum(['good', 'damaged', 'lost']).default('good'),
      notes: z.string().trim().max(500).default(''),
    })
    .parse(req.body ?? {})
  const result = await returnLoan(idSchema.parse(req.params.id), req.user.id, input)
  res.json({
    ...result,
    message: result.fine
      ? `Return recorded. A fine of ${result.fine.amount} was created (${result.late} days late).`
      : input.condition === 'lost'
        ? 'Recorded as lost.'
        : 'Book returned.',
  })
}
// Staff note what they did to chase an overdue loan (call, message, visit).
export const postIdFollowUp = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const { note } = z.object({ note: z.string().trim().min(3).max(500) }).parse(req.body)
  const loan = requireRecord(
    await Loan.findOneAndUpdate(
      { _id: id, returnedAt: null },
      { $push: { followUps: { note, by: req.user.id } } },
      { returnDocument: 'after' },
    ),
    'Active loan not found',
  )
  await Audit.create({ actor: req.user.id, action: 'loan.followup', entity: id })
  res.json({ message: 'Follow-up recorded.', followUps: loan.followUps })
}
export const postIdRenew = async (req, res) => {
  const isMember = req.user.role === 'member'
  const options = {
    memberOnly: isMember,
    updatedDueDate: req.body?.updatedDueDate || req.body?.dueDate || req.body?.newDueDate,
  }
  res.json(await renewLoan(idSchema.parse(req.params.id), req.user.id, options))
}
