import mongoose, { Schema } from 'mongoose'

export const Publisher =
  mongoose.models.Publisher ||
  mongoose.model(
    'Publisher',
    new Schema(
      {
        name: { type: String, required: true, trim: true },
        nameKey: { type: String, required: true, unique: true },
        contact: { type: String, default: '' },
        archived: { type: Boolean, default: false },
      },
      { timestamps: true },
    ),
  )
Publisher.schema.index({ name: 1 })
