import mongoose, { Schema } from 'mongoose'

// Messages sent from the public Contact page, handled by staff in the Contact messages inbox.
export const ContactMessage = mongoose.model(
  'ContactMessage',
  new Schema(
    {
      name: { type: String, required: true },
      email: { type: String, required: true },
      subject: { type: String, required: true },
      message: { type: String, required: true },
      status: { type: String, enum: ['new', 'handled'], default: 'new', index: true },
      replies: [
        {
          message: String,
          by: { type: Schema.Types.ObjectId, ref: 'User' },
          at: { type: Date, default: Date.now },
          _id: false,
        },
      ],
    },
    { timestamps: true },
  ),
)
ContactMessage.schema.index({ status: 1, createdAt: -1 })
