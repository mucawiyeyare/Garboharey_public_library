import express from 'express'
import {
  deleteAcquisition,
  getAcquisitions,
  getAcquisitionSummary,
  postAcquisition,
} from '../controllers/acquisitionController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

// /api/staff/acquisitions — record how many books were purchased, donated, etc.
const router = express.Router()
router.use(authenticate, authorize('librarian', 'admin'))
router.get('/summary', getAcquisitionSummary)
router.get('/', getAcquisitions)
router.post('/', postAcquisition)
router.delete('/:id', authorize('admin'), deleteAcquisition)

export default router
