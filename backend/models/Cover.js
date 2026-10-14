import mongoose, { Schema } from 'mongoose'

export const Cover =
  mongoose.models.Cover ||
  mongoose.model(
    'Cover',
    new Schema(
      {
        data: { type: Buffer, required: true },
        contentType: { type: String, default: 'image/jpeg' },
        size: { type: Number, default: 0 },
      },
      { timestamps: true },
    ),
  )
