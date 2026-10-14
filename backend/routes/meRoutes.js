import express from 'express'
import { z } from 'zod'
import { authenticate } from '../middleware/authMiddleware.js'
import { requireRecord } from '../middleware/errorMiddleware.js'
import { Loan } from '../models/Borrowing.js'
import { Notification } from '../models/Notification.js'
import { Reservation } from '../models/Reservation.js'
import { User } from '../models/User.js'
import { Book } from '../models/Book.js'
import { idSchema } from '../validators/bookValidator.js'

const router = express.Router()
router.use(authenticate)

const profile = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  phone: user.phone ?? '',
  role: user.role,
  lang: user.lang ?? 'en',
  theme: user.theme ?? 'system',
  emailVerified: user.emailVerified ?? false,
  avatarId: user.avatarId ? String(user.avatarId) : null,
})

router.get('/', async (req, res) => res.json(profile(requireRecord(await User.findById(req.user.id)))))

// Language and theme follow the signed-in user across devices.
router.patch('/preferences', async (req, res) => {
  const input = z
    .object({ lang: z.enum(['en', 'so', 'ar']), theme: z.enum(['light', 'dark', 'system']) })
    .partial()
    .parse(req.body)
  const user = requireRecord(
    await User.findByIdAndUpdate(req.user.id, { $set: input }, { returnDocument: 'after' }),
  )
  res.json(profile(user))
})

// Reading list ("Save for later").
router.get('/saved', async (req, res) => {
  const user = requireRecord(await User.findById(req.user.id).select('savedBooks'))
  const books = await Book.find({ _id: { $in: user.savedBooks ?? [] }, archived: false }).lean()
  res.json(books)
})
router.put('/saved/:bookId', async (req, res) => {
  const bookId = idSchema.parse(req.params.bookId)
  requireRecord(await Book.exists({ _id: bookId }))
  await User.updateOne({ _id: req.user.id }, { $addToSet: { savedBooks: bookId } })
  res.json({ message: 'Saved to your reading list.' })
})
router.delete('/saved/:bookId', async (req, res) => {
  const bookId = idSchema.parse(req.params.bookId)
  await User.updateOne({ _id: req.user.id }, { $pull: { savedBooks: bookId } })
  res.json({ message: 'Removed from your reading list.' })
})

// The signed-in user's own dashboard figures (members only ever see their own records).
router.get('/summary', async (req, res) => {
  const member = req.user.id
  const now = new Date()
  const soon = new Date(now.getTime() + 3 * 86400000)
  const [user, currentLoans, dueSoon, overdue, reservations, unreadNotices] = await Promise.all([
    User.findById(member).select('status createdAt').lean(),
    Loan.countDocuments({ member, returnedAt: null }),
    Loan.countDocuments({ member, returnedAt: null, dueAt: { $gte: now, $lte: soon } }),
    Loan.countDocuments({ member, returnedAt: null, dueAt: { $lt: now } }),
    Reservation.countDocuments({
      member,
      status: { $in: ['pending', 'accepted', 'approved', 'waiting'] },
    }),
    Notification.countDocuments({ member, read: false }),
  ])
  requireRecord(user)
  res.json({
    currentLoans,
    dueSoon,
    overdue,
    reservations,
    unreadNotices,
    membershipStatus: user.status,
    memberSince: user.createdAt,
  })
})

export default router

// /api/notifications — the signed-in member's own notices, plus their overdue loans.
export const memberNoticeRouter = express.Router()
memberNoticeRouter.use(authenticate)
memberNoticeRouter.get('/', async (req, res) => {
  const [items, overdue] = await Promise.all([
    Notification.find({ member: req.user.id, audience: { $ne: 'staff' } })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
    Loan.find({ member: req.user.id, returnedAt: null, dueAt: { $lt: new Date() } })
      .populate('book', 'title')
      .lean(),
  ])
  res.json({ items, overdue })
})
memberNoticeRouter.patch('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  requireRecord(
    await Notification.findOneAndUpdate({ _id: id, member: req.user.id }, { $set: { read: true } }),
  )
  res.json({ message: 'Marked as read.' })
})
