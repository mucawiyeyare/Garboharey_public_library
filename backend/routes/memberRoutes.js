import express from 'express'
import { getMembers, postMembers, patchMembersId } from '../controllers/memberController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)
router.use(authorize('librarian', 'admin'))

router.get('/', getMembers)
router.get('/members', getMembers)
router.post('/', postMembers)
router.post('/members', postMembers)
router.patch('/:id', patchMembersId)
router.patch('/members/:id', patchMembersId)

export default router
