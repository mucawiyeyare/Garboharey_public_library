import express from 'express'
import {
  getPublicFounders,
  getStaffFounders,
  postFounder,
  putFounder,
  patchFounderStatus,
  deleteFounder,
  getPublicBoardMembers,
  getStaffBoardMembers,
  postBoardMember,
  putBoardMember,
  patchBoardMemberStatus,
  deleteBoardMember,
  getDirectorMessage,
  putDirectorMessage,
} from '../controllers/governanceController.js'
import { authenticate, authorize } from '../middleware/authMiddleware.js'

// Public endpoints: /api/governance
export const publicGovernanceRouter = express.Router()
publicGovernanceRouter.get('/founders', getPublicFounders)
publicGovernanceRouter.get('/board', getPublicBoardMembers)
publicGovernanceRouter.get('/director-message', getDirectorMessage)

import { postCover } from '../controllers/taxonomyController.js'

// Staff management endpoints: /api/staff/governance
export const staffGovernanceRouter = express.Router()
staffGovernanceRouter.use(authenticate, authorize('director', 'admin'))

// Photo Upload for Governance
staffGovernanceRouter.post('/upload-photo', postCover)

// Founders
staffGovernanceRouter.get('/founders', getStaffFounders)
staffGovernanceRouter.post('/founders', postFounder)
staffGovernanceRouter.put('/founders/:id', putFounder)
staffGovernanceRouter.patch('/founders/:id/status', patchFounderStatus)
staffGovernanceRouter.delete('/founders/:id', deleteFounder)

// Board of Directors
staffGovernanceRouter.get('/board', getStaffBoardMembers)
staffGovernanceRouter.post('/board', postBoardMember)
staffGovernanceRouter.put('/board/:id', putBoardMember)
staffGovernanceRouter.patch('/board/:id/status', patchBoardMemberStatus)
staffGovernanceRouter.delete('/board/:id', deleteBoardMember)

// Director's Message
staffGovernanceRouter.get('/director-message', getDirectorMessage)
staffGovernanceRouter.put('/director-message', putDirectorMessage)

export default publicGovernanceRouter
