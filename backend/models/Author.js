import mongoose, { Schema } from 'mongoose'

export const nameKey = (name) => name.trim().replace(/\s+/g, ' ').toLowerCase()

export const Author =
  mongoose.models.Author ||
  mongoose.model(
    'Author',
    new Schema(
      {
        name: { type: String, required: true, trim: true },
        nameKey: { type: String, required: true, unique: true },
        biography: { type: String, default: '' },
        country: { type: String, default: '' },
        archived: { type: Boolean, default: false },
      },
      { timestamps: true },
    ),
  )
Author.schema.index({ name: 1 })

export { Publisher } from './Publisher.js'
