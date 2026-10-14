import mongoose, { Schema } from 'mongoose'
import { Author, Publisher, nameKey } from './Author.js'

const localized = new Schema({ en: String, so: String, ar: String }, { _id: false })

export const Category =
  mongoose.models.Category ||
  mongoose.model(
    'Category',
    new Schema(
      {
        name: { type: localized, default: () => ({}) },
        description: { type: localized, default: () => ({}) },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      },
      { timestamps: true },
    ),
  )
Category.schema.index({ status: 1 })

export { Author, Publisher, nameKey }
