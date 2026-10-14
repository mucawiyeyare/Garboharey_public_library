import mongoose, { Schema } from 'mongoose'

export const transactionTypes = ['income', 'expense']
// Where income comes from: ordinary receipts, donations/funding, or library fines.
export const incomeStreams = ['general', 'donation', 'grant', 'sponsorship', 'fine']
export const fundingStreams = ['donation', 'grant', 'sponsorship']
export const paymentMethods = ['cash', 'bank', 'mobile', 'other']

// One money movement. Records are never deleted: a wrong entry is voided with a reason,
// so the cashbook and reports always keep a complete history.
export const FinanceTransaction = mongoose.model(
  'FinanceTransaction',
  new Schema(
    {
      type: { type: String, enum: transactionTypes, required: true, index: true },
      stream: { type: String, enum: incomeStreams, default: 'general', index: true },
      category: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0.01 },
      date: { type: Date, required: true, index: true },
      method: { type: String, enum: paymentMethods, default: 'cash' },
      // Payer, payee, donor or funder
      party: { type: String, default: '' },
      reference: { type: String, default: '' },
      description: { type: String, default: '' },
      receiptNo: { type: String, default: '' },
      fine: { type: Schema.Types.ObjectId, ref: 'Fine', default: null },
      status: { type: String, enum: ['posted', 'void'], default: 'posted', index: true },
      voidReason: { type: String, default: '' },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
  ),
)
FinanceTransaction.schema.index({ status: 1, date: -1 })

// A spending limit for one expense category over a period.
export const Budget = mongoose.model(
  'Budget',
  new Schema(
    {
      name: { type: String, required: true, trim: true },
      category: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
      periodStart: { type: Date, required: true },
      periodEnd: { type: Date, required: true },
      notes: { type: String, default: '' },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
  ),
)

export const defaultIncomeCategories = [
  'Membership fees',
  'Fines',
  'Photocopy & printing',
  'Room hire',
  'Donations',
  'Grants',
  'Other income',
]
export const defaultExpenseCategories = [
  'Books & materials',
  'Salaries & allowances',
  'Rent & utilities',
  'Equipment & furniture',
  'Maintenance & repairs',
  'Events & programs',
  'Transport',
  'Office supplies',
  'Other expenses',
]

export const FinanceSettings = mongoose.model(
  'FinanceSettings',
  new Schema(
    {
      key: { type: String, unique: true, default: 'library' },
      currency: { type: String, default: 'USD' },
      // Money already held when the library started using this system
      openingBalance: { type: Number, default: 0 },
      openingDate: { type: Date, default: null },
      receiptPrefix: { type: String, default: 'GPL-R' },
      nextReceipt: { type: Number, default: 1 },
      incomeCategories: { type: [String], default: () => [...defaultIncomeCategories] },
      expenseCategories: { type: [String], default: () => [...defaultExpenseCategories] },
      // Record fine payments as income automatically
      recordFinePayments: { type: Boolean, default: true },
    },
    { timestamps: true },
  ),
)

export async function getFinanceSettings(session) {
  return FinanceSettings.findOneAndUpdate(
    { key: 'library' },
    { $setOnInsert: { key: 'library' } },
    { upsert: true, returnDocument: 'after', session },
  )
}

// Reserves the next receipt number, e.g. GPL-R-000042.
export async function nextReceiptNo(session) {
  await getFinanceSettings(session)
  const settings = await FinanceSettings.findOneAndUpdate(
    { key: 'library' },
    { $inc: { nextReceipt: 1 } },
    { returnDocument: 'before', session },
  )
  return `${settings.receiptPrefix}-${String(settings.nextReceipt).padStart(6, '0')}`
}
