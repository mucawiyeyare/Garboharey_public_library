import express from 'express'
import {
  getList,
  postList,
  postIdReturn,
  postIdRenew,
  postIdFollowUp,
} from '../controllers/borrowingController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)
router.get('/', getList)
router.post('/', authorize('librarian', 'admin'), postList)
router.post('/:id/return', authorize('librarian', 'admin'), postIdReturn)
router.post('/:id/renew', postIdRenew)
router.post('/:id/follow-up', authorize('librarian', 'admin'), postIdFollowUp)

export default router
