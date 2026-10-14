import mongoose, { Schema } from 'mongoose'

const options = { timestamps: true }

export const Loan =
  mongoose.models.Loan ||
  mongoose.model(
    'Loan',
    new Schema(
      {
        book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
        copy: { type: Schema.Types.ObjectId, ref: 'Copy', default: null },
        copies: [{ type: Schema.Types.ObjectId, ref: 'Copy' }],
        numberOfCopies: { type: Number, default: 1 },
        // Borrower info - works for both regular borrowers and registered accounts
        borrowerName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        borrowerType: {
          type: String,
          enum: ['regular', 'member', 'librarian', 'admin'],
          default: 'regular',
          index: true,
        },
        // Member is optional: set when borrower is a registered Member, Librarian, or Admin
        member: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
        borrowingDate: { type: Date, default: Date.now },
        dueAt: { type: Date, required: true, index: true },
        returnedAt: { type: Date, default: null, index: true },
        source: {
          type: String,
          enum: ['reservation', 'admin', 'librarian', 'manual'],
          default: 'admin',
        },
        status: {
          type: String,
          enum: ['active', 'returned', 'overdue'],
          default: 'active',
        },
        reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', default: null },
        renewals: { type: Number, default: 0 },
        outcome: { type: String, enum: ['returned', 'lost', null], default: null },
        returnCondition: { type: String, enum: ['good', 'damaged', 'lost', null], default: null },
        returnNotes: { type: String, default: '' },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        // Set once the "borrowing time has ended" notification has been sent.
        overdueNotifiedAt: { type: Date, default: null },
        followUps: [
          {
            note: String,
            by: { type: Schema.Types.ObjectId, ref: 'User' },
            at: { type: Date, default: Date.now },
            _id: false,
          },
        ],
      },
      options,
    ),
  )

Loan.schema.index({ returnedAt: 1, dueAt: 1 })

export { Loan as Borrowing }
