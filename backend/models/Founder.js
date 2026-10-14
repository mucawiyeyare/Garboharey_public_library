import mongoose, { Schema } from 'mongoose'

const founderSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      required: true,
      trim: true,
      default: 'Confirmed founding role',
    },
    biography: {
      type: String,
      trim: true,
      default: '',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Archived'],
      default: 'Published',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'founders',
  },
)

founderSchema.index({ status: 1, displayOrder: 1, createdAt: 1 })

export const Founder = mongoose.models.Founder || mongoose.model('Founder', founderSchema, 'founders')
