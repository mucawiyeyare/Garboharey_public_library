import mongoose, { Schema } from 'mongoose'

const boardMemberSchema = new Schema(
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
      default: 'Board Member',
    },
    biography: {
      type: String,
      trim: true,
      default: '',
    },
    termStartDate: {
      type: Date,
      default: null,
    },
    termEndDate: {
      type: Date,
      default: null,
    },
    isCurrent: {
      type: Boolean,
      default: true,
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
    collection: 'boardMembers',
  },
)

boardMemberSchema.index({ status: 1, isCurrent: 1, displayOrder: 1, createdAt: 1 })

export const BoardMember =
  mongoose.models.BoardMember || mongoose.model('BoardMember', boardMemberSchema, 'boardMembers')
