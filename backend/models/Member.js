import mongoose, { Schema } from 'mongoose'

export { User as Member, User } from './User.js'

export const Application =
  mongoose.models.Application ||
  mongoose.model(
    'Application',
    new Schema(
      {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        dateOfBirth: { type: Date, default: null },
        preferredContact: { type: String, enum: ['email', 'phone'], default: 'phone' },
        lang: { type: String, enum: ['en', 'so', 'ar'], default: 'en' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        reason: { type: String, default: '' },
        member: { type: Schema.Types.ObjectId, ref: 'User', default: null },
      },
      { timestamps: true },
    ),
  )
Application.schema.index({ status: 1, createdAt: -1 })
