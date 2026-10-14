import express from 'express'
import { authenticate, authorize } from '../middleware/authMiddleware.js'
import { runReport } from '../services/reportService.js'
import { getReports } from '../controllers/reportController.js'

const router = express.Router()

router.use(authenticate, authorize('librarian', 'director', 'admin'))

router.get('/run/:type', runReport)
router.get('/', getReports)

export default router
