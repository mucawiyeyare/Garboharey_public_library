import mongoose, { Schema } from 'mongoose'

export const acquisitionTypes = ['purchased', 'donated', 'exchange', 'transfer', 'other']

// A record of books received (how many, how, and from whom). It does not add books to the
// catalogue; it only keeps count of the library's acquisitions.
export const Acquisition = mongoose.model(
  'Acquisition',
  new Schema(
    {
      type: { type: String, enum: acquisitionTypes, required: true, index: true },
      quantity: { type: Number, required: true, min: 1 },
      // Name of the book received (free text; not linked to the catalogue)
      bookName: { type: String, default: '' },
      // What was received, e.g. "Science textbooks" (free text)
      title: { type: String, default: '' },
      // Donor, supplier or partner library
      source: { type: String, default: '' },
      cost: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: '' },
      acquiredAt: { type: Date, default: Date.now },
      reference: { type: String, default: '' },
      // Auto-generated income reference number for purchased acquisitions (INC-YYYYMMDD-XXXX)
      incomeRefNo: { type: String, default: '' },
      notes: { type: String, default: '' },
      // Only set on older records created when acquisitions also added copies
      book: { type: Schema.Types.ObjectId, ref: 'Book', default: null },
      createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true },
  ),
)
Acquisition.schema.index({ acquiredAt: -1, _id: -1 })
