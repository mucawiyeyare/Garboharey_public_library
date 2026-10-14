import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import mongoose from 'mongoose'
import { z } from 'zod'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { Book } from '../models/Book.js'
import { Copy } from '../models/BookCopy.js'
import { Loan } from '../models/Borrowing.js'
import { Reservation } from '../models/Reservation.js'
import { Category } from '../models/Category.js'
import { Content } from '../models/Announcement.js'
import { User } from '../models/User.js'
import { markNextReady } from '../services/borrowingService.js'
import { resolveBookInput } from '../services/bookService.js'
import { bookSchema, copySchema, idSchema } from '../validators/bookValidator.js'

export const getBooks = async (req, res) => {
  const page = pagination(req, 500)
  const search = textSearch(req.query.q)
  const categoryFilter = req.query.category ? { category: req.query.category } : {}
  const languageFilter = req.query.language ? { language: req.query.language } : {}
  const yearFilter = req.query.year ? { year: Number(req.query.year) } : {}

  const searchFilter = search
    ? { $or: [{ title: search }, { author: search }, { isbn: search }, { genre: search }] }
    : {}

  const filter = {
    ...searchFilter,
    ...categoryFilter,
    ...languageFilter,
    ...yearFilter,
  }

  const [items, total, categoriesList] = await Promise.all([
    Book.find(filter)
      .populate('category')
      .sort({ title: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Book.countDocuments(filter),
    Category.find({ status: 'active' }).lean(),
  ])

  // Attach accurate copy counts (total, borrowed, reserved, available) and formatted categoryName to each book
  const bookObjectIds = items.map((b) => new mongoose.Types.ObjectId(b._id))

  const [copyStats, loanStats, reservationStats] = await Promise.all([
    Copy.aggregate([
      { $match: { book: { $in: bookObjectIds }, status: { $ne: 'retired' } } },
      { $group: { _id: '$book', total: { $sum: 1 } } },
    ]),
    Loan.aggregate([
      { $match: { book: { $in: bookObjectIds }, returnedAt: null, status: { $in: ['active', 'overdue'] } } },
      { $group: { _id: '$book', borrowed: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
    Reservation.aggregate([
      { $match: { book: { $in: bookObjectIds }, status: { $in: ['pending', 'waiting'] } } },
      { $group: { _id: '$book', reserved: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
  ])

  const totalMap = new Map(copyStats.map((s) => [String(s._id), s.total]))
  const borrowedMap = new Map(loanStats.map((s) => [String(s._id), s.borrowed]))
  const reservedMap = new Map(reservationStats.map((s) => [String(s._id), s.reserved]))

  for (const item of items) {
    const total = totalMap.get(String(item._id)) || 0
    const borrowed = borrowedMap.get(String(item._id)) || 0
    const reserved = reservedMap.get(String(item._id)) || 0
    const available = Math.max(0, total - borrowed - reserved)

    item.copies = {
      total,
      borrowed,
      reserved,
      available,
    }
    if (item.category && item.category.name) {
      item.categoryName =
        item.category.name.en ||
        item.category.name.so ||
        item.category.name.ar ||
        item.category.name ||
        item.genre ||
        ''
    } else {
      item.categoryName = item.genre || ''
    }
  }

  const formattedCategories = categoriesList.map((c) => ({
    _id: String(c._id),
    name: c.name?.en || c.name?.so || c.name?.ar || 'General',
  }))

  res.json({
    items,
    data: items,
    total,
    page: page.page,
    pages: Math.max(1, Math.ceil(total / page.limit)),
    limit: page.limit,
    categories: formattedCategories,
    languages: ['en', 'so', 'ar', 'other'],
  })
}

export const getBookById = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const book = requireRecord(
    await Book.findById(id)
      .populate('category')
      .populate('authors')
      .populate('publisher')
      .lean(),
  )
  const bookObjectId = new mongoose.Types.ObjectId(id)
  const [copiesTotal, loanResult, reservationResult, inventory] = await Promise.all([
    Copy.countDocuments({ book: bookObjectId, status: { $ne: 'retired' } }),
    Loan.aggregate([
      { $match: { book: bookObjectId, returnedAt: null, status: { $in: ['active', 'overdue'] } } },
      { $group: { _id: null, count: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
    Reservation.aggregate([
      { $match: { book: bookObjectId, status: { $in: ['pending', 'waiting'] } } },
      { $group: { _id: null, count: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
    Copy.find({ book: bookObjectId, status: { $ne: 'retired' } }).sort({ barcode: 1 }).lean(),
  ])
  const total = copiesTotal
  const borrowed = loanResult[0]?.count || 0
  const reserved = reservationResult[0]?.count || 0
  const available = Math.max(0, total - borrowed - reserved)

  book.copies = { total, borrowed, reserved, available }
  book.inventory = inventory
  book.categoryName =
    book.category?.name?.en ||
    book.category?.name?.so ||
    book.category?.name?.ar ||
    book.genre ||
    ''
  res.json(book)
}

export const getHomeBooks = async (req, res) => {
  const lang = req.query.lang || 'en'
  const [featuredDocs, recentDocs, totalTitles, totalCopies, availableCopies, membersCount, categoriesDocs] =
    await Promise.all([
      Book.find({ archived: false, featured: true }).populate('category').sort({ updatedAt: -1 }).limit(6).lean(),
      Book.find({ archived: false }).populate('category').sort({ createdAt: -1 }).limit(6).lean(),
      Book.countDocuments({ archived: false }),
      Copy.countDocuments({ status: { $ne: 'retired' } }),
      Copy.countDocuments({ status: 'available' }),
      User.countDocuments({ role: 'member', status: 'active' }),
      Category.find({ status: 'active' }).limit(8).lean(),
    ])

  const featuredList = featuredDocs.length ? featuredDocs : recentDocs.slice(0, 4)

  const allObjectIds = [...new Set([...featuredList, ...recentDocs].map((b) => new mongoose.Types.ObjectId(b._id)))]
  const [copyStats, loanStats, reservationStats] = await Promise.all([
    Copy.aggregate([
      { $match: { book: { $in: allObjectIds }, status: { $ne: 'retired' } } },
      { $group: { _id: '$book', total: { $sum: 1 } } },
    ]),
    Loan.aggregate([
      { $match: { book: { $in: allObjectIds }, returnedAt: null, status: { $in: ['active', 'overdue'] } } },
      { $group: { _id: '$book', borrowed: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
    Reservation.aggregate([
      { $match: { book: { $in: allObjectIds }, status: { $in: ['pending', 'waiting'] } } },
      { $group: { _id: '$book', reserved: { $sum: { $ifNull: ['$numberOfCopies', 1] } } } },
    ]),
  ])
  const totalMap = new Map(copyStats.map((s) => [String(s._id), s.total]))
  const borrowedMap = new Map(loanStats.map((s) => [String(s._id), s.borrowed]))
  const reservedMap = new Map(reservationStats.map((s) => [String(s._id), s.reserved]))

  const formatBook = (b) => {
    const total = totalMap.get(String(b._id)) || 0
    const borrowed = borrowedMap.get(String(b._id)) || 0
    const reserved = reservedMap.get(String(b._id)) || 0
    const available = Math.max(0, total - borrowed - reserved)
    return {
      ...b,
      categoryName:
        b.category?.name?.en ||
        b.category?.name?.so ||
        b.category?.name?.ar ||
        b.genre ||
        '',
      copies: { total, borrowed, reserved, available },
    }
  }

  const catStats = await Book.aggregate([
    { $match: { archived: false, category: { $ne: null } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const catCountMap = new Map(catStats.map((s) => [String(s._id), s.count]))

  const categories = categoriesDocs.map((c) => ({
    _id: String(c._id),
    name: c.name?.[lang] || c.name?.en || c.name?.so || c.name?.ar || 'Category',
    books: catCountMap.get(String(c._id)) || 0,
  }))

  // Services and announcements come from the library's own published content (Site content /
  // Services pages), shown in the visitor's language with an English fallback.
  const visible = { archived: false, published: true }
  const [serviceDocs, newsDocs, servicesCount] = await Promise.all([
    Content.find({ ...visible, kind: 'service' }).sort({ order: 1, createdAt: 1 }).limit(8).lean(),
    Content.find({ ...visible, kind: { $in: ['news', 'event'] } })
      .sort({ featured: -1, createdAt: -1 })
      .limit(3)
      .lean(),
    Content.countDocuments({ ...visible, kind: 'service' }),
  ])
  const pick = (value) =>
    value?.[lang]?.trim() || value?.en?.trim() || value?.so?.trim() || value?.ar?.trim() || ''
  const localize = (item) => ({
    _id: String(item._id),
    kind: item.kind,
    title: pick(item.title),
    body: pick(item.body),
    featured: item.featured,
    eventDate: item.eventDate,
    createdAt: item.createdAt,
  })
  const services = serviceDocs.map(localize).filter((item) => item.title)
  const announcements = newsDocs.map(localize).filter((item) => item.title)

  res.json({
    stats: {
      titles: totalTitles,
      available: availableCopies,
      members: membersCount,
      services: servicesCount,
    },
    featured: featuredList.map(formatBook),
    recent: recentDocs.map(formatBook),
    categories,
    services,
    announcements,
  })
}

export const getStats = async (_req, res) => {
  const [titles, totalCopies, available, members, loans] = await Promise.all([
    Book.countDocuments({ archived: false }),
    Copy.countDocuments(),
    Copy.countDocuments({ status: 'available' }),
    User.countDocuments({ role: 'member' }),
    // Every loan ever issued ("Books borrowed so far" on the About page)
    Loan.countDocuments(),
  ])
  res.json({ titles, copies: totalCopies, available, members, loans })
}

export const postBooks = async (req, res) => {
  const input = bookSchema.parse(req.body)
  const initialCopies = Math.max(0, Math.min(1000, Number(input.initialCopies ?? req.body.initialCopies ?? 50)))

  const book = await mongoose.connection.transaction(async (session) => {
    const bookData = await resolveBookInput(input, session)
    delete bookData.initialCopies
    const [created] = await Book.create([bookData], { session })

    // Auto-generate requested number of copies (like 50, 100, 150)
    if (initialCopies > 0) {
      const shelfName =
        req.body.shelf ||
        (created.genre ? `${created.genre.slice(0, 3).toUpperCase()} 01` : 'GEN 01')
      const copiesToInsert = []
      const idSuffix = String(created._id).slice(-4).toUpperCase()
      for (let i = 1; i <= initialCopies; i++) {
        copiesToInsert.push({
          book: created._id,
          barcode: `BIB-${idSuffix}-${String(i).padStart(3, '0')}`,
          shelf: shelfName,
          status: 'available',
        })
      }
      await Copy.insertMany(copiesToInsert, { session: session ?? undefined })
    }

    await Audit.create(
      [{ actor: req.user?.id || req.user?._id, action: 'book.created', entity: String(created._id) }],
      { session },
    )
    return created
  })
  res.status(201).json(book)
}

export const patchBooksId = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = bookSchema.parse(req.body)
  const book = await mongoose.connection.transaction(async (session) => {
    const updated = requireRecord(
      await Book.findByIdAndUpdate(
        id,
        { $set: await resolveBookInput(input, session), $inc: { circulationVersion: 1 } },
        { returnDocument: 'after', session },
      ),
    )
    if (
      input.archived &&
      ((await Loan.exists({ book: id, returnedAt: null }).session(session)) ||
        (await Reservation.exists({ book: id, status: 'waiting' }).session(session)))
    )
      throw new ApiError(409, 'Resolve active loans and reservations before archiving')
    await Audit.create(
      [
        {
          actor: req.user?.id || req.user?._id,
          action: input.archived ? 'book.archived' : 'book.updated',
          entity: id,
        },
      ],
      { session },
    )
    return updated
  })
  res.json(book)
}

export const deleteBooksId = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const activeLoans = await Loan.countDocuments({ book: id, returnedAt: null })
  if (activeLoans > 0) {
    throw new ApiError(400, 'Cannot delete book with active loans. Please ensure all borrowed copies are returned first.')
  }
  await Copy.deleteMany({ book: id })
  await Reservation.deleteMany({ book: id })
  await Book.findByIdAndDelete(id)
  await Audit.create([
    {
      actor: req.user?.id || req.user?._id,
      action: 'book.deleted',
      entity: String(id),
    },
  ])
  res.status(204).end()
}

export const getCopies = async (req, res) => {
  const page = pagination(req, 1000)
  const search = textSearch(req.query.q)
  const books = search
    ? await Book.find({ $or: [{ title: search }, { author: search }] }).distinct('_id')
    : []
  const filter = {
    ...(req.query.book ? { book: idSchema.parse(req.query.book) } : {}),
    ...(req.query.status === 'available' ? { status: 'available' } : {}),
    ...(search ? { $or: [{ barcode: search }, { shelf: search }, { book: { $in: books } }] } : {}),
  }
  const [items, total] = await Promise.all([
    Copy.find(filter)
      .populate('book', 'title')
      .sort({ barcode: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Copy.countDocuments(filter),
  ])
  sendPage(res, items, total, page)
}

export const postBooksIdCopies = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = copySchema.parse(req.body)
  const quantity = Math.max(1, Math.min(500, Number(input.quantity || req.body.quantity || 1)))

  const result = await mongoose.connection.transaction(async (session) => {
    requireRecord(
      await Book.findOneAndUpdate(
        { _id: id, archived: false },
        { $inc: { circulationVersion: 1 } },
        { session, returnDocument: 'after' },
      ),
    )

    const idSuffix = String(id).slice(-4).toUpperCase()
    // Number new barcodes after the highest existing one, so removed copies never cause clashes.
    const existing = await Copy.find({ book: id }).select('barcode').session(session).lean()
    const prefix = `BIB-${idSuffix}-`
    const highest = existing.reduce((max, copy) => {
      const number = copy.barcode?.startsWith(prefix) ? Number(copy.barcode.slice(prefix.length)) : 0
      return Number.isFinite(number) && number > max ? number : max
    }, existing.length)
    const copiesToInsert = []

    for (let i = 1; i <= quantity; i++) {
      const copyNum = highest + i
      const barcode =
        quantity === 1 && input.barcode
          ? input.barcode
          : `BIB-${idSuffix}-${String(copyNum).padStart(3, '0')}`
      copiesToInsert.push({
        book: id,
        barcode,
        shelf: input.shelf || 'GEN 01',
        status: 'available',
      })
    }

    const created = await Copy.insertMany(copiesToInsert, { session: session ?? undefined })
    await Audit.create(
      [{ actor: req.user?.id || req.user?._id, action: 'copy.created', entity: String(id) }],
      { session },
    )
    return created[0]
  })
  res.status(201).json(result)
}

// Removes copies that are on the shelf (newest first); borrowed or reserved copies are never touched.
export const postBooksIdCopiesRemove = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const { quantity } = z
    .object({ quantity: z.coerce.number().int().min(1).max(500) })
    .parse(req.body)
  const removed = await mongoose.connection.transaction(async (session) => {
    requireRecord(await Book.findById(id).session(session))
    const available = await Copy.find({ book: id, status: 'available' })
      .sort({ createdAt: -1, _id: -1 })
      .limit(quantity)
      .session(session)
    if (available.length < quantity)
      throw new ApiError(
        400,
        `Only ${available.length} available cop${available.length === 1 ? 'y' : 'ies'} can be removed. Borrowed or reserved copies must be returned first.`,
      )
    await Copy.deleteMany({ _id: { $in: available.map((copy) => copy._id) } }, { session })
    await Book.updateOne({ _id: id }, { $inc: { circulationVersion: 1 } }, { session })
    await Audit.create(
      [{ actor: req.user?.id || req.user?._id, action: 'copy.removed', entity: String(id) }],
      { session },
    )
    return available.length
  })
  res.json({ removed })
}

export const patchCopiesId = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = z
    .object({
      shelf: z.string().trim().min(1).max(80),
      status: z.enum(['available', 'retired', 'damaged', 'lost']),
    })
    .parse(req.body)
  const copy = await mongoose.connection.transaction(async (session) => {
    const changed = requireRecord(
      await Copy.findOneAndUpdate({ _id: id, status: { $ne: 'on_loan' } }, input, {
        returnDocument: 'after',
        session,
      }),
      'Return the copy before changing its status',
    )
    await Book.updateOne({ _id: changed.book }, { $inc: { circulationVersion: 1 } }, { session })
    if (changed.status === 'available') await markNextReady(changed.book, session)
    await Audit.create(
      [{ actor: req.user?.id || req.user?._id, action: 'copy.updated', entity: id }],
      { session },
    )
    return changed
  })
  res.json(copy)
}

export const deleteCopiesId = async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const copy = await Copy.findById(id)
  if (!copy) throw new ApiError(404, 'Copy not found')
  if (copy.status === 'on_loan') {
    throw new ApiError(400, 'Cannot delete a copy that is currently on loan. Please return the book first.')
  }
  await Copy.findByIdAndDelete(id)
  await Book.updateOne({ _id: copy.book }, { $inc: { circulationVersion: 1 } })
  await Audit.create([
    {
      actor: req.user?.id || req.user?._id,
      action: 'copy.deleted',
      entity: String(id),
    },
  ])
  res.status(204).end()
}
