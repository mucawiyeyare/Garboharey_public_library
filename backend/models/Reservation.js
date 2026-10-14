import mongoose, { Schema } from 'mongoose'

const options = { timestamps: true }

export const Reservation =
  mongoose.models.Reservation ||
  mongoose.model(
    'Reservation',
    new Schema(
      {
        book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
        // Member can be null for regular borrowers without a system account
        member: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        borrowerName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        numberOfCopies: { type: Number, default: 1, min: 1 },
        copies: [{ type: Schema.Types.ObjectId, ref: 'Copy' }],
        loan: { type: Schema.Types.ObjectId, ref: 'Loan', default: null },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'approved', 'rejected', 'waiting', 'fulfilled', 'cancelled', 'expired'],
          default: 'pending',
          index: true,
        },
        ready: { type: Boolean, default: false },
        readyAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        // Date the borrower plans to return the books; becomes the loan due date on approval.
        returnDate: { type: Date, default: null },
      },
      options,
    ),
  )

Reservation.schema.index({ status: 1, createdAt: -1 })
