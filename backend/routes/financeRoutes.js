import express from 'express'
import { z } from 'zod'
import { authenticate, authorize } from '../middleware/authMiddleware.js'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import {
  Budget,
  FinanceSettings,
  FinanceTransaction,
  fundingStreams,
  getFinanceSettings,
  incomeStreams,
  nextReceiptNo,
  paymentMethods,
  transactionTypes,
} from '../models/Finance.js'
import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import { idSchema } from '../validators/bookValidator.js'

// /api/staff/finance — administrators and directors only.
const router = express.Router()
router.use(authenticate, authorize('admin'))

const round = (value) => Math.round(value * 100) / 100
const dateOnly = z.coerce.date()
const posted = { status: 'posted' }

// Optional date range from ?from=YYYY-MM-DD&to=YYYY-MM-DD (the "to" day is included).
function dateRange(query) {
  const range = {}
  if (query.from) range.$gte = new Date(`${query.from}T00:00:00.000Z`)
  if (query.to) range.$lte = new Date(`${query.to}T23:59:59.999Z`)
  return Object.keys(range).length ? { date: range } : {}
}

async function totals(match) {
  const rows = await FinanceTransaction.aggregate([
    { $match: { ...posted, ...match } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ])
  const income = rows.find((row) => row._id === 'income')?.total ?? 0
  const expense = rows.find((row) => row._id === 'expense')?.total ?? 0
  return { income: round(income), expense: round(expense), net: round(income - expense) }
}

// ── Settings ──────────────────────────────────────────────────────────────────
const settingsSchema = z
  .object({
    currency: z.string().trim().min(1).max(10),
    openingBalance: z.coerce.number().min(-1e10).max(1e10),
    openingDate: dateOnly.nullable(),
    receiptPrefix: z.string().trim().min(1).max(12),
    incomeCategories: z.array(z.string().trim().min(1).max(60)).min(1).max(60),
    expenseCategories: z.array(z.string().trim().min(1).max(60)).min(1).max(60),
    recordFinePayments: z.boolean(),
  })
  .partial()

router.get('/settings', async (_req, res) => res.json(await getFinanceSettings()))
router.put('/settings', async (req, res) => {
  const input = settingsSchema.parse(req.body)
  for (const key of ['incomeCategories', 'expenseCategories'])
    if (input[key]) input[key] = [...new Set(input[key])]
  await getFinanceSettings()
  const settings = await FinanceSettings.findOneAndUpdate(
    { key: 'library' },
    { $set: input },
    { returnDocument: 'after' },
  )
  await Audit.create({ actor: req.user.id, action: 'finance.settings', entity: 'library' })
  res.json(settings)
})

// ── Transactions (income, expenses, donations) ────────────────────────────────
const transactionSchema = z.object({
  type: z.enum(transactionTypes),
  stream: z.enum(incomeStreams).default('general'),
  category: z.string().trim().min(1).max(60),
  amount: z.coerce.number().positive().max(1e10),
  date: dateOnly,
  method: z.enum(paymentMethods).default('cash'),
  party: z.string().trim().max(150).default(''),
  reference: z.string().trim().max(100).default(''),
  description: z.string().trim().max(1000).default(''),
})

router.get('/transactions', async (req, res) => {
  const page = pagination(req, 500)
  const search = textSearch(req.query.q)
  const filter = {
    ...(transactionTypes.includes(req.query.type) ? { type: req.query.type } : {}),
    ...(req.query.stream === 'funding'
      ? { stream: { $in: fundingStreams } }
      : incomeStreams.includes(req.query.stream)
        ? { stream: req.query.stream }
        : {}),
    ...(req.query.category ? { category: String(req.query.category) } : {}),
    ...(['posted', 'void'].includes(req.query.status) ? { status: req.query.status } : {}),
    ...dateRange(req.query),
    ...(search
      ? {
          $or: [
            { party: search },
            { description: search },
            { reference: search },
            { receiptNo: search },
            { category: search },
          ],
        }
      : {}),
  }
  const [items, total, sums] = await Promise.all([
    FinanceTransaction.find(filter)
      .populate('createdBy', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    FinanceTransaction.countDocuments(filter),
    totals({ ...filter, status: 'posted' }),
  ])
  if (page.paginated)
    return res.json({
      items,
      total,
      page: page.page,
      limit: page.limit,
      pages: Math.max(1, Math.ceil(total / page.limit)),
      sums,
    })
  sendPage(res, items, total, page)
})

router.post('/transactions', async (req, res) => {
  const input = transactionSchema.parse(req.body)
  if (input.type === 'expense') input.stream = 'general'
  const transaction = await FinanceTransaction.create({
    ...input,
    receiptNo: input.type === 'income' ? await nextReceiptNo() : '',
    createdBy: req.user.id,
  })
  await Audit.create({
    actor: req.user.id,
    action: `finance.${input.type}`,
    entity: String(transaction._id),
  })
  res.status(201).json({
    message:
      input.type === 'income'
        ? `Income recorded. Receipt ${transaction.receiptNo}.`
        : 'Expense recorded.',
    transaction,
  })
})

router.patch('/transactions/:id/void', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const { reason } = z.object({ reason: z.string().trim().min(3).max(300) }).parse(req.body)
  const transaction = requireRecord(await FinanceTransaction.findById(id))
  if (transaction.status === 'void') throw new ApiError(409, 'This entry is already void.')
  transaction.status = 'void'
  transaction.voidReason = reason
  await transaction.save()
  await Audit.create({ actor: req.user.id, action: 'finance.void', entity: id })
  res.json({ message: 'Entry voided. It stays in the history but no longer counts in totals.' })
})

// ── Dashboard summary ─────────────────────────────────────────────────────────
router.get('/summary', async (_req, res) => {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1))
  const settings = await getFinanceSettings()
  const [allTime, month, year, funding, byCategory, monthly, recent, budgets] = await Promise.all([
    totals({}),
    totals({ date: { $gte: monthStart } }),
    totals({ date: { $gte: yearStart } }),
    FinanceTransaction.aggregate([
      { $match: { ...posted, stream: { $in: fundingStreams }, date: { $gte: yearStart } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { ...posted, date: { $gte: yearStart } } },
      { $group: { _id: { type: '$type', category: '$category' }, total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]),
    FinanceTransaction.aggregate([
      {
        $match: {
          ...posted,
          date: { $gte: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1)) },
        },
      },
      {
        $group: {
          _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
    ]),
    FinanceTransaction.find(posted).sort({ date: -1, createdAt: -1 }).limit(8).lean(),
    budgetsWithSpending({ periodEnd: { $gte: now } }),
  ])
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1))
    const key = d.toISOString().slice(0, 7)
    const pick = (type) =>
      round(monthly.find((row) => row._id.month === key && row._id.type === type)?.total ?? 0)
    return { month: key, income: pick('income'), expense: pick('expense') }
  })
  res.json({
    currency: settings.currency,
    balance: round(settings.openingBalance + allTime.net),
    month,
    year,
    fundingThisYear: round(funding[0]?.total ?? 0),
    byCategory: byCategory.map((row) => ({ ...row._id, total: round(row.total) })),
    months,
    recent,
    budgets,
  })
})

// ── Budgets ───────────────────────────────────────────────────────────────────
async function budgetsWithSpending(filter = {}) {
  const budgets = await Budget.find(filter).sort({ periodStart: -1 }).lean()
  return Promise.all(
    budgets.map(async (budget) => {
      const [row] = await FinanceTransaction.aggregate([
        {
          $match: {
            ...posted,
            type: 'expense',
            category: budget.category,
            date: { $gte: budget.periodStart, $lte: budget.periodEnd },
          },
        },
        { $group: { _id: null, spent: { $sum: '$amount' } } },
      ])
      const spent = round(row?.spent ?? 0)
      return {
        ...budget,
        spent,
        remaining: round(budget.amount - spent),
        percent: budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0,
      }
    }),
  )
}

const budgetSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    category: z.string().trim().min(1).max(60),
    amount: z.coerce.number().min(0).max(1e10),
    periodStart: dateOnly,
    periodEnd: dateOnly,
    notes: z.string().trim().max(500).default(''),
  })
  .refine((b) => b.periodEnd >= b.periodStart, {
    message: 'The end date must be after the start date.',
    path: ['periodEnd'],
  })
const endOfDay = (date) => new Date(new Date(date).setUTCHours(23, 59, 59, 999))

router.get('/budgets', async (_req, res) => res.json(await budgetsWithSpending()))
router.post('/budgets', async (req, res) => {
  const input = budgetSchema.parse(req.body)
  const budget = await Budget.create({
    ...input,
    periodEnd: endOfDay(input.periodEnd),
    createdBy: req.user.id,
  })
  await Audit.create({ actor: req.user.id, action: 'finance.budget', entity: String(budget._id) })
  res.status(201).json({ message: 'Budget saved.', budget })
})
router.put('/budgets/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  const input = budgetSchema.parse(req.body)
  requireRecord(
    await Budget.findByIdAndUpdate(id, { $set: { ...input, periodEnd: endOfDay(input.periodEnd) } }),
  )
  await Audit.create({ actor: req.user.id, action: 'finance.budget.updated', entity: id })
  res.json({ message: 'Budget updated.' })
})
router.delete('/budgets/:id', async (req, res) => {
  const id = idSchema.parse(req.params.id)
  requireRecord(await Budget.findByIdAndDelete(id))
  await Audit.create({ actor: req.user.id, action: 'finance.budget.deleted', entity: id })
  res.json({ message: 'Budget deleted.' })
})

// ── Cashbook: every entry in date order with a running balance ────────────────
router.get('/cashbook', async (req, res) => {
  const settings = await getFinanceSettings()
  const method = paymentMethods.includes(req.query.method) ? { method: req.query.method } : {}
  const range = dateRange(req.query)
  // Balance carried forward: opening balance + everything before the first day shown.
  const before = req.query.from
    ? await totals({ ...method, date: { $lt: new Date(`${req.query.from}T00:00:00.000Z`) } })
    : { net: 0 }
  const opening = round((method.method ? 0 : settings.openingBalance) + before.net)
  const entries = await FinanceTransaction.find({ ...posted, ...method, ...range })
    .sort({ date: 1, createdAt: 1 })
    .limit(2000)
    .lean()
  let balance = opening
  const rows = entries.map((entry) => {
    balance = round(balance + (entry.type === 'income' ? entry.amount : -entry.amount))
    return { ...entry, balance }
  })
  const sums = await totals({ ...method, ...range })
  res.json({ currency: settings.currency, opening, closing: balance, ...sums, rows })
})

// ── Reports: one year, month by month and by category ────────────────────────
router.get('/report', async (req, res) => {
  const year = z.coerce.number().int().min(2000).max(2100).parse(req.query.year ?? new Date().getUTCFullYear())
  const start = new Date(Date.UTC(year, 0, 1))
  const end = new Date(Date.UTC(year + 1, 0, 1))
  const match = { ...posted, date: { $gte: start, $lt: end } }
  const [monthly, byCategory, byStream, settings] = await Promise.all([
    FinanceTransaction.aggregate([
      { $match: match },
      { $group: { _id: { month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
    ]),
    FinanceTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.type': 1, total: -1 } },
    ]),
    FinanceTransaction.aggregate([
      { $match: { ...match, type: 'income' } },
      { $group: { _id: '$stream', total: { $sum: '$amount' } } },
    ]),
    getFinanceSettings(),
  ])
  const months = Array.from({ length: 12 }, (_, i) => {
    const pick = (type) =>
      round(monthly.find((row) => row._id.month === i + 1 && row._id.type === type)?.total ?? 0)
    const income = pick('income')
    const expense = pick('expense')
    return { month: i + 1, income, expense, net: round(income - expense) }
  })
  const income = round(months.reduce((sum, m) => sum + m.income, 0))
  const expense = round(months.reduce((sum, m) => sum + m.expense, 0))
  res.json({
    year,
    currency: settings.currency,
    income,
    expense,
    net: round(income - expense),
    months,
    byCategory: byCategory.map((row) => ({ ...row._id, total: round(row.total), count: row.count })),
    byStream: Object.fromEntries(byStream.map((row) => [row._id, round(row.total)])),
  })
})

export default router
