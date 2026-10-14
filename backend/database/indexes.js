import { User } from '../models/User.js'
import { Book } from '../models/Book.js'
import { Copy } from '../models/BookCopy.js'
import { Author } from '../models/Author.js'
import { Publisher } from '../models/Publisher.js'
import { Category } from '../models/Category.js'
import { Borrowing } from '../models/Borrowing.js'
import { Reservation } from '../models/Reservation.js'
import { Fine } from '../models/Fine.js'
import { Notification } from '../models/Notification.js'
import { Announcement } from '../models/Announcement.js'
import { AuditLog } from '../models/AuditLog.js'

export const allModels = [
  User,
  Book,
  Copy,
  Author,
  Publisher,
  Category,
  Borrowing,
  Reservation,
  Fine,
  Notification,
  Announcement,
  AuditLog,
]

export async function ensureIndexes() {
  for (const model of allModels) {
    if (model && typeof model.init === 'function') {
      await model.init()
    }
  }
}
