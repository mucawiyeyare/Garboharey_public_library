import express from 'express'
import {
  getBooks,
  getBookById,
  getHomeBooks,
  getStats,
  postBooks,
  patchBooksId,
  deleteBooksId,
  getCopies,
  postBooksIdCopies,
  postBooksIdCopiesRemove,
  patchCopiesId,
  deleteCopiesId,
} from '../controllers/bookController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public read routes
router.get('/home', getHomeBooks)
router.get('/stats', getStats)
router.get('/copies', getCopies)
router.get('/', getBooks)
router.get('/:id', getBookById)

// Staff protected routes
router.post('/', authenticate, authorize('librarian', 'admin', 'director'), postBooks)
router.patch('/:id', authenticate, authorize('librarian', 'admin', 'director'), patchBooksId)
router.delete('/:id', authenticate, authorize('librarian', 'admin', 'director'), deleteBooksId)
router.post('/:id/copies', authenticate, authorize('librarian', 'admin', 'director'), postBooksIdCopies)
router.post('/:id/copies/remove', authenticate, authorize('librarian', 'admin', 'director'), postBooksIdCopiesRemove)
router.patch('/copies/:id', authenticate, authorize('librarian', 'admin', 'director'), patchCopiesId)
router.delete('/copies/:id', authenticate, authorize('librarian', 'admin', 'director'), deleteCopiesId)

export default router
