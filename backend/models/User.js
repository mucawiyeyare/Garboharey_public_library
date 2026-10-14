import mongoose, { Schema } from 'mongoose'
const options = { timestamps: true }
export const User = mongoose.model(
  'User',
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      phone: { type: String, default: '' },
      passwordHash: { type: String, required: true, select: false },
      role: { type: String, enum: ['member', 'librarian', 'director', 'admin'], default: 'member' },
      status: { type: String, enum: ['active', 'suspended'], default: 'active' },
      lang: { type: String, enum: ['en', 'so', 'ar'], default: 'en' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      emailVerified: { type: Boolean, default: false },
      avatarId: { type: Schema.Types.ObjectId, ref: 'Cover', default: null },
      authVersion: { type: Number, default: 0 },
      savedBooks: [{ type: Schema.Types.ObjectId, ref: 'Book' }],
      circulationVersion: { type: Number, default: 0 },
    },
    options,
  ),
)

export const RefreshSession =
  mongoose.models.RefreshSession ||
  mongoose.model(
    'RefreshSession',
    new Schema(
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        authVersion: { type: Number, default: 0 },
        tokenHash: { type: String, required: true, unique: true },
        expiresAt: { type: Date, required: true },
        rotatedAt: { type: Date, default: null },
      },
      options,
    ),
  )
RefreshSession.schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const SecurityToken =
  mongoose.models.SecurityToken ||
  mongoose.model(
    'SecurityToken',
    new Schema(
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        kind: { type: String, enum: ['reset', 'verify'], required: true },
        tokenHash: { type: String, unique: true, required: true },
        expiresAt: { type: Date, required: true, index: { expires: 0 } },
      },
      options,
    ),
  )

