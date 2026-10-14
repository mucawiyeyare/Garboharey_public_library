import express from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/authMiddleware.js'
import { requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { getPolicy, Policy } from '../models/Fine.js'
import { Notification } from '../models/Notification.js'
import { idSchema } from '../validators/bookValidator.js'
import { pagination, sendPage } from '../utils/pagination.js'

const policyFields = {
  loanDays: z.coerce.number().int().min(1).max(365),
  maxLoans: z.coerce.number().int().min(1).max(100),
  maxRenewals: z.coerce.number().int().min(0).max(20),
  renewalDays: z.coerce.number().int().min(1).max(365),
  fineEnabled: z.boolean(),
  finePerDay: z.coerce.number().min(0).max(100000),
  graceDays: z.coerce.number().int().min(0).max(365),
  maxFine: z.coerce.number().min(0).max(10000000),
  currency: z.string().trim().max(10),
  reservationHoldDays: z.coerce.number().int().min(0).max(365),
}
const policySchema = z.object(policyFields).partial()
const publicPolicy = (policy) =>
  Object.fromEntries(Object.keys(policyFields).map((key) => [key, policy[key]]))

// Public loan rules (loan period, limits, fines) for the website and the loan desk.
export const publicPolicyRouter = express.Router()
publicPolicyRouter.get('/', async (_req, res) => res.json(publicPolicy(await getPolicy())))

// /api/staff/... — administrator & director tools, plus staff notifications.
export const staffRouter = express.Router()
staffRouter.use(authenticate)

staffRouter.get('/policies', authorize('admin'), async (_req, res) =>
  res.json(publicPolicy(await getPolicy())),
)
staffRouter.put('/policies', authorize('admin'), async (req, res) => {
  const input = policySchema.parse(req.body)
  await getPolicy()
  const policy = await Policy.findOneAndUpdate(
    { key: 'library' },
    { $set: input },
    { returnDocument: 'after' },
  )
  await Audit.create({ actor: req.user.id, action: 'policy.updated', entity: 'library' })
  res.json(publicPolicy(policy))
})

// Audit history: who did what, newest first.
staffRouter.get('/audit', authorize('admin'), async (req, res) => {
  const page = pagination(req, 200)
  const filter = req.query.action ? { action: String(req.query.action) } : {}
  const [items, total] = await Promise.all([
    Audit.find(filter)
      .populate('actor', 'name email role')
      .sort({ createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Audit.countDocuments(filter),
  ])
  sendPage(res, items, total, page)
})

// Staff notifications (e.g. a loan's borrowing time has ended).
const staffNotices = authorize('admin', 'librarian')
staffRouter.get('/notifications/unread', staffNotices, async (_req, res) =>
  res.json({ count: await Notification.countDocuments({ audience: 'staff', read: false }) }),
)
staffRouter.get('/notifications', staffNotices, async (req, res) => {
  const page = pagination(req, 200)
  const filter = {
    audience: 'staff',
    ...(req.query.status === 'unread' ? { read: false } : {}),
  }
  const [items, total] = await Promise.all([
    Notification.find(filter)
      .populate({
        path: 'loan',
        select: 'borrowerName phone dueAt returnedAt book',
        populate: { path: 'book', select: 'title' },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Notification.countDocuments(filter),
  ])
  sendPage(res, items, total, page)
})
staffRouter.post('/notifications/read-all', staffNotices, async (_req, res) => {
  const result = await Notification.updateMany(
    { audience: 'staff', read: false },
    { $set: { read: true } },
  )
  res.json({ message: 'All notifications marked as read.', updated: result.modifiedCount })
})
staffRouter.patch('/notifications/:id', staffNotices, async (req, res) => {
  const id = idSchema.parse(req.params.id)
  requireRecord(
    await Notification.findOneAndUpdate({ _id: id, audience: 'staff' }, { $set: { read: true } }),
  )
  res.json({ message: 'Marked as read.' })
})
