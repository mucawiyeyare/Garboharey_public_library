import { z } from 'zod'
import { requireRecord } from '../middleware/errorMiddleware.js'
import { Acquisition, acquisitionTypes } from '../models/Acquisition.js'
import { Audit } from '../models/AuditLog.js'
import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import { idSchema } from '../validators/bookValidator.js'

const acquisitionSchema = z.object({
  type: z.enum(acquisitionTypes),
  quantity: z.coerce.number().int().min(1).max(100000),
  bookName: z.string().trim().max(200).default(''),
  title: z.string().trim().max(200).default(''),
  source: z.string().trim().max(150).default(''),
  cost: z.coerce.number().min(0).max(100000000).default(0),
  currency: z.string().trim().max(10).default(''),
  acquiredAt: z.coerce.date().optional(),
  reference: z.string().trim().max(100).default(''),
  notes: z.string().trim().max(1000).default(''),
})

// Record books received. This only keeps count; it never adds books or copies to the catalogue.
export const postAcquisition = async (req, res) => {
  const input = acquisitionSchema.parse(req.body)
  const purchased = input.type === 'purchased'
  const acquisition = await Acquisition.create({
    ...input,
    cost: purchased ? input.cost : 0,
    currency: purchased ? input.currency : '',
    acquiredAt: input.acquiredAt ?? new Date(),
    createdBy: req.user.id,
  })
  await Audit.create({
    actor: req.user.id,
    action: `acquisition.${input.type}`,
    entity: String(acquisition._id),
  })
  res.status(201).json({
    message: `${input.quantity} ${input.type} book${input.quantity === 1 ? '' : 's'} recorded.`,
    acquisition,
  })
}

export const deleteAcquisition = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  requireRecord(await Acquisition.findByIdAndDelete(id), 'Record not found')
  await Audit.create({ actor: req.user.id, action: 'acquisition.deleted', entity: id })
  res.json({ message: 'Record deleted.' })
}

export const getAcquisitions = async (req, res) => {
  const page = pagination(req, 200)
  const type = acquisitionTypes.includes(req.query.type) ? req.query.type : null
  const search = textSearch(req.query.q)
  const filter = {
    ...(type ? { type } : {}),
    ...(search
      ? {
          $or: [
            { bookName: search },
            { title: search },
            { source: search },
            { reference: search },
            { notes: search },
          ],
        }
      : {}),
  }
  const [items, total] = await Promise.all([
    Acquisition.find(filter)
      .populate('book', 'title')
      .populate('createdBy', 'name')
      .sort({ acquiredAt: -1, _id: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Acquisition.countDocuments(filter),
  ])
  sendPage(res, items, total, page)
}

// Number of books and spending per acquisition type, for the summary tiles.
export const getAcquisitionSummary = async (_req, res) => {
  const rows = await Acquisition.aggregate([
    {
      $group: {
        _id: '$type',
        books: { $sum: '$quantity' },
        records: { $sum: 1 },
        cost: { $sum: '$cost' },
      },
    },
  ])
  const byType = Object.fromEntries(
    acquisitionTypes.map((type) => {
      const row = rows.find((item) => item._id === type)
      return [type, { books: row?.books ?? 0, records: row?.records ?? 0, cost: row?.cost ?? 0 }]
    }),
  )
  res.json({
    ...byType,
    total: Object.values(byType).reduce((sum, item) => sum + item.books, 0),
  })
}
