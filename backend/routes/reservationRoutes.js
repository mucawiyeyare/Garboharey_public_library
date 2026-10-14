import express from 'express'
import {
  getList,
  postList,
  postApprove,
  postReject,
  postIdCancel,
} from '../controllers/reservationController.js'
import { authenticate, authorize, optionalAuth } from '../middleware/authMiddleware.js'

const router = express.Router()

// Allow anyone (guest or member) to submit a reservation with Pending status
router.post('/', optionalAuth, postList)

// List reservations (staff sees all, members see theirs)
router.get('/', optionalAuth, getList)

// Staff review actions: accept or reject reservations
router.post('/:id/approve', authenticate, authorize('librarian', 'admin', 'director'), postApprove)
router.post('/:id/accept', authenticate, authorize('librarian', 'admin', 'director'), postApprove)
router.post('/:id/reject', authenticate, authorize('librarian', 'admin', 'director'), postReject)

// Cancellation
router.post('/:id/cancel', optionalAuth, postIdCancel)

export default router
