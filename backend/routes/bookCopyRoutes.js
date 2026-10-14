import express from 'express'
import { getCopies, patchCopiesId, deleteCopiesId } from '../controllers/bookController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.get('/', getCopies)
router.patch('/:id', authenticate, authorize('librarian', 'admin', 'director'), patchCopiesId)
router.delete('/:id', authenticate, authorize('librarian', 'admin', 'director'), deleteCopiesId)

export default router
