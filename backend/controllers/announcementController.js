import { z } from 'zod'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { isAdmin } from '../middleware/authMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { Content, contentKinds } from '../models/Announcement.js'
import { idSchema } from '../validators/bookValidator.js'

const langs = ['en', 'so', 'ar']
// Librarians manage services, news and events; administrators manage every kind of page content.
const librarianKinds = ['service', 'news', 'event']

const localized = (max) =>
  z
    .object({
      en: z.string().trim().max(max).optional().default(''),
      so: z.string().trim().max(max).optional().default(''),
      ar: z.string().trim().max(max).optional().default(''),
    })
    .default({})

const contentSchema = z.object({
  kind: z.enum(contentKinds),
  title: localized(200),
  body: localized(8000),
  eventDate: z.coerce.date().nullable().optional().default(null),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(true),
  order: z.coerce.number().int().min(0).optional().default(0),
})

const canManage = (user, kind) => isAdmin(user) || librarianKinds.includes(kind)

const withMissing = (item) => ({
  ...item,
  missing: langs.filter((lng) => !item.title?.[lng]?.trim()),
})

// Picks the requested language and falls back to English, then any filled translation.
const pick = (value, lang) =>
  value?.[lang]?.trim() || value?.en?.trim() || langs.map((l) => value?.[l]?.trim()).find(Boolean) || ''

const localize = (item, lang) => ({
  _id: item._id,
  kind: item.kind,
  title: pick(item.title, lang),
  body: pick(item.body, lang),
  eventDate: item.eventDate,
  featured: item.featured,
  order: item.order,
  createdAt: item.createdAt,
})

const requestLang = (req) => (langs.includes(req.query.lang) ? req.query.lang : 'en')

export const getStaffContent = async (req, res) => {
  const kind = z.enum(contentKinds).parse(req.query.kind)
  if (!canManage(req.user, kind)) throw new ApiError(403, 'You cannot manage this content')
  const items = await Content.find({ kind, archived: false })
    .sort(kind === 'event' ? { eventDate: -1, createdAt: -1 } : { order: 1, createdAt: -1 })
    .lean()
  res.json(items.map(withMissing))
}

export const postStaffContent = async (req, res) => {
  const input = contentSchema.parse(req.body)
  if (!canManage(req.user, input.kind)) throw new ApiError(403, 'You cannot manage this content')
  if (!langs.some((lng) => input.title[lng]))
    throw new ApiError(400, 'Add a title in at least one language')
  const item = await Content.create({ ...input, createdBy: req.user.id })
  await Audit.create({ actor: req.user.id, action: 'content.created', entity: String(item._id) })
  res.status(201).json(withMissing(item.toObject()))
}

export const putStaffContent = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = contentSchema.parse(req.body)
  const item = requireRecord(await Content.findOne({ _id: id, archived: false }))
  if (!canManage(req.user, item.kind) || !canManage(req.user, input.kind))
    throw new ApiError(403, 'You cannot manage this content')
  if (!langs.some((lng) => input.title[lng]))
    throw new ApiError(400, 'Add a title in at least one language')
  Object.assign(item, input)
  await item.save()
  await Audit.create({ actor: req.user.id, action: 'content.updated', entity: id })
  res.json(withMissing(item.toObject()))
}

export const deleteStaffContent = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const item = requireRecord(await Content.findOne({ _id: id, archived: false }))
  if (!canManage(req.user, item.kind)) throw new ApiError(403, 'You cannot manage this content')
  item.archived = true
  await item.save()
  await Audit.create({ actor: req.user.id, action: 'content.archived', entity: id })
  res.status(204).end()
}

export const getPublicContent = async (req, res) => {
  const kind = z.enum(contentKinds).parse(req.params.kind)
  const items = await Content.find({ kind, archived: false, published: true })
    .sort(kind === 'event' ? { eventDate: 1, createdAt: -1 } : { order: 1, createdAt: -1 })
    .limit(200)
    .lean()
  const lang = requestLang(req)
  res.json(items.map((item) => localize(item, lang)).filter((item) => item.title))
}

export const getPublicContentItem = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const item = requireRecord(
    await Content.findOne({ _id: id, archived: false, published: true }).lean(),
  )
  res.json(localize(item, requestLang(req)))
}
