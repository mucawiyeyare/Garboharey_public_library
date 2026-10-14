import mongoose, { Schema } from 'mongoose'
const options = { timestamps: true }
// Member notices go to one reader; staff notices (audience 'staff') appear in the staff workspace.
export const Notification = mongoose.model(
  'Notification',
  new Schema(
    {
      audience: { type: String, enum: ['member', 'staff'], default: 'member', index: true },
      member: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
      loan: { type: Schema.Types.ObjectId, ref: 'Loan', default: null },
      message: { type: String, required: true },
      key: { type: String, default: null },
      params: { type: Object, default: () => ({}) },
      read: { type: Boolean, default: false },
    },
    options,
  ),
)
Notification.schema.index({ audience: 1, read: 1, createdAt: -1 })
