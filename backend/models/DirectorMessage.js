import mongoose, { Schema } from 'mongoose'

const directorMessageSchema = new Schema(
  {
    title: {
      type: String,
      default: 'A Warm Welcome to Our Library',
      trim: true,
    },
    quoteSomali: {
      type: String,
      default:
        'Waxaan si diirran ugu soo dhoweynayaa dhammaan dadka jecel akhriska iyo aqoonta Maktabadda Dadweynaha Garbaharay. Akhrisku waa furaha fahamka, aqoontuna waa saldhigga horumarka qofka iyo bulshada.',
      trim: true,
    },
    message: {
      type: String,
      default:
        'On behalf of Garbaharey Public Library, I warmly welcome everyone who values reading, learning, and the pursuit of knowledge.\n\nA library is more than a place where books are kept. It is a place where ideas are explored, understanding grows, and people discover new opportunities through learning. Whether you are a student seeking knowledge, an educator supporting learning, or a reader exploring new perspectives, the library represents a shared commitment to education and community development.\n\nWe encourage everyone to make reading a regular part of life, participate in educational activities, and help build a community where knowledge is valued and shared',
      trim: true,
    },
    directorName: {
      type: String,
      default: 'Library Director',
      trim: true,
    },
    directorTitle: {
      type: String,
      default: 'Garbaharey Public Library',
      trim: true,
    },
    photo: {
      type: String,
      default: '/images/director-portrait.webp',
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'directorMessages',
  },
)

export const DirectorMessage =
  mongoose.models.DirectorMessage ||
  mongoose.model('DirectorMessage', directorMessageSchema, 'directorMessages')
