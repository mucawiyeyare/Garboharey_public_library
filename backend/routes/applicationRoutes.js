import { Router } from 'express'
import {
  postApplication,
  getApplicationByRef,
  getStaffApplications,
  approveApplication,
  rejectApplication,
} from '../controllers/applicationController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

// Public router for applicants (/api/library/applications)
export const publicApplicationRouter = Router()
publicApplicationRouter.post('/', postApplication)
publicApplicationRouter.get('/:ref', getApplicationByRef)

// Staff router for Admin / Director / Librarian (/api/staff/applications)
export const staffApplicationRouter = Router()
staffApplicationRouter.use(authenticate)
staffApplicationRouter.use(authorize('admin', 'director', 'librarian'))
staffApplicationRouter.get('/', getStaffApplications)
staffApplicationRouter.post('/:id/approve', approveApplication)
staffApplicationRouter.post('/:id/reject', rejectApplication)

export default publicApplicationRouter
