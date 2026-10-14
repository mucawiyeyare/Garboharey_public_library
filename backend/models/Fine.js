import mongoose, { Schema } from 'mongoose'

// One fine per late loan. Payments and waivers are recorded, never deleted.
export const Fine = mongoose.model(
  'Fine',
  new Schema(
    {
      // Registered member, if any; walk-in borrowers are identified by name and phone.
      member: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
      borrowerName: { type: String, default: '' },
      phone: { type: String, default: '' },
      loan: { type: Schema.Types.ObjectId, ref: 'Loan', required: true, unique: true },
      amount: { type: Number, required: true, min: 0 },
      paid: { type: Number, default: 0, min: 0 },
      daysOverdue: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['outstanding', 'partially_paid', 'paid', 'waived'],
        default: 'outstanding',
      },
      history: [
        {
          action: { type: String, enum: ['payment', 'waiver'] },
          amount: Number,
          note: String,
          by: { type: Schema.Types.ObjectId, ref: 'User' },
          at: { type: Date, default: Date.now },
          _id: false,
        },
      ],
    },
    { timestamps: true },
  ),
)
Fine.schema.index({ status: 1, createdAt: -1 })

export const Policy =
  mongoose.models.Policy ||
  mongoose.model(
    'Policy',
    new Schema(
      {
        key: { type: String, unique: true, default: 'library' },
        loanDays: { type: Number, default: 21 },
        maxLoans: { type: Number, default: 5 },
        maxRenewals: { type: Number, default: 2 },
        renewalDays: { type: Number, default: 14 },
        fineEnabled: { type: Boolean, default: false },
        finePerDay: { type: Number, default: 0 },
        graceDays: { type: Number, default: 0 },
        maxFine: { type: Number, default: 0 },
        currency: { type: String, default: '' },
        reservationHoldDays: { type: Number, default: 0 },
      },
      { timestamps: true },
    ),
  )

export async function getPolicy() {
  return Policy.findOneAndUpdate(
    { key: 'library' },
    { $setOnInsert: { key: 'library' } },
    { upsert: true, returnDocument: 'after' },
  )
}

