import express from 'express'
import {
  getStaffContent,
  postStaffContent,
  putStaffContent,
  deleteStaffContent,
  getPublicContent,
  getPublicContentItem,
} from '../controllers/announcementController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

// Public, published content in the visitor's language: /api/library/content
const router = express.Router()
router.get('/item/:id', getPublicContentItem)
router.get('/:kind', getPublicContent)

// Staff editing of news, events and page content: /api/staff/content
export const staffContentRouter = express.Router()
staffContentRouter.use(authenticate, authorize('librarian', 'admin'))
staffContentRouter.get('/', getStaffContent)
staffContentRouter.post('/', postStaffContent)
staffContentRouter.put('/:id', putStaffContent)
staffContentRouter.delete('/:id', deleteStaffContent)

export default router
