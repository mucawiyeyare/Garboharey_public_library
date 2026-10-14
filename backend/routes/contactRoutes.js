import express from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { config } from '../config/env.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'
import { requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { ContactMessage } from '../models/ContactMessage.js'
import { Notification } from '../models/Notification.js'
import { queueEmail } from '../services/notificationService.js'
import { pagination, sendPage } from '../utils/pagination.js'
import { idSchema } from '../validators/bookValidator.js'

const messageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().min(1).max(100),
  message: z.string().trim().min(10).max(3000),
})

// POST /api/contact — public Contact page (rate-limited against spam).
export const publicContactRouter = express.Router()
publicContactRouter.post(
  '/',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: config.NODE_ENV === 'test' ? 200 : 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }),
  async (req, res) => {
    const input = messageSchema.parse(req.body)
    const saved = await ContactMessage.create(input)
    // Staff see new messages in their notifications too.
    await Notification.create({
      audience: 'staff',
      key: 'contactMessage',
      params: { name: input.name, subject: input.subject },
      message: `New contact message from ${input.name}: ${input.subject}`,
    })
    res.status(201).json({ message: 'Thank you. Your message was sent to the library.', id: saved._id })
  },
)

// /api/staff/contact — the staff inbox.
export const staffContactRouter = express.Router()
staffContactRouter.use(authenticate, authorize('librarian', 'admin'))

staffContactRouter.get('/', async (req, res) => {
  const page = pagination(req, 200)
  const filter = ['new', 'handled'].includes(req.query.status) ? { status: req.query.status } : {}
  const [items, total] = await Promise.all([
    ContactMessage.find(filter)
      .populate('replies.by', 'name')
      .sort({ status: -1, createdAt: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    ContactMessage.countDocuments(filter),
  ])
  sendPage(res, items, total, page)
})

staffContactRouter.patch('/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const { status } = z.object({ status: z.enum(['new', 'handled']) }).parse(req.body)
  requireRecord(await ContactMessage.findByIdAndUpdate(id, { $set: { status } }))
  await Audit.create({ actor: req.user.id, action: `contact.${status}`, entity: id })
  res.json({ message: status === 'handled' ? 'Marked as handled.' : 'Reopened.' })
})

// Saves the reply on the message and queues it to the sender's email address.
staffContactRouter.post('/:id/reply', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const { message } = z.object({ message: z.string().trim().min(10).max(3000) }).parse(req.body)
  const item = requireRecord(await ContactMessage.findById(id))
  item.replies.push({ message, by: req.user.id })
  item.status = 'handled'
  await item.save()
  await queueEmail(item.email, `Re: ${item.subject}`, message)
  await Audit.create({ actor: req.user.id, action: 'contact.replied', entity: id })
  res.json({ message: 'Reply saved and the message marked as handled.' })
})
