import express from 'express'
import { getMembers, postMembers, patchMembersId, deleteMember } from '../controllers/memberController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(authenticate)
router.use(authorize('director', 'librarian', 'admin'))

router.get('/', getMembers)
router.get('/members', getMembers)
router.post('/', postMembers)
router.post('/members', postMembers)
router.patch('/:id', patchMembersId)
router.patch('/members/:id', patchMembersId)
router.delete('/:id', deleteMember)
router.delete('/members/:id', deleteMember)

export default router
