import express from 'express'
import {
  getCategories,
  postCategory,
  putCategory,
  deleteCategory,
  getPublishers,
  postPublisher,
  putPublisher,
  deletePublisher,
  getAuthors,
  postAuthor,
  putAuthor,
  deleteAuthor,
  postCover,
  getCover,
  getLibrarySettings,
  putLibrarySettings,
} from '../controllers/taxonomyController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

export const taxonomyRouter = express.Router()

// Categories
taxonomyRouter.get('/categories', getCategories)
taxonomyRouter.post('/categories', authenticate, authorize('librarian', 'admin'), postCategory)
taxonomyRouter.put('/categories/:id', authenticate, authorize('librarian', 'admin'), putCategory)
taxonomyRouter.delete('/categories/:id', authenticate, authorize('librarian', 'admin'), deleteCategory)

// Publishers
taxonomyRouter.get('/publishers', getPublishers)
taxonomyRouter.post('/publishers', authenticate, authorize('librarian', 'admin'), postPublisher)
taxonomyRouter.put('/publishers/:id', authenticate, authorize('librarian', 'admin'), putPublisher)
taxonomyRouter.delete('/publishers/:id', authenticate, authorize('librarian', 'admin'), deletePublisher)

// Authors
taxonomyRouter.get('/authors', getAuthors)
taxonomyRouter.post('/authors', authenticate, authorize('librarian', 'admin'), postAuthor)
taxonomyRouter.put('/authors/:id', authenticate, authorize('librarian', 'admin'), putAuthor)
taxonomyRouter.delete('/authors/:id', authenticate, authorize('librarian', 'admin'), deleteAuthor)

// Covers
taxonomyRouter.post('/covers', authenticate, authorize('librarian', 'admin'), postCover)

// Settings
taxonomyRouter.get('/settings', getLibrarySettings)
taxonomyRouter.put('/settings', authenticate, authorize('admin'), putLibrarySettings)

// Export cover router for public GET /api/covers/:id
export const coverRouter = express.Router()
coverRouter.get('/:id', getCover)

export const settingsRouter = express.Router()
settingsRouter.get('/settings', getLibrarySettings)
