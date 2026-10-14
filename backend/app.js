import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { ZodError } from 'zod'

import { config } from './config/env.js'
import { isTrustedOrigin } from './config/cors.js'
import { ApiError } from './middleware/errorMiddleware.js'

// ── Route imports ─────────────────────────────────────────────────────────────
import authRouter from './routes/authRoutes.js'
import bookRouter from './routes/bookRoutes.js'
import bookCopyRouter from './routes/bookCopyRoutes.js'
import borrowingRouter from './routes/borrowingRoutes.js'
import reservationRouter from './routes/reservationRoutes.js'
import fineRouter from './routes/fineRoutes.js'
import memberRouter from './routes/memberRoutes.js'
import reportRouter from './routes/reportRoutes.js'
import announcementRouter, { staffContentRouter } from './routes/announcementRoutes.js'
import meRouter, { memberNoticeRouter } from './routes/meRoutes.js'
import { staffRouter, publicPolicyRouter } from './routes/staffRoutes.js'
import acquisitionRouter from './routes/acquisitionRoutes.js'
import { publicContactRouter, staffContactRouter } from './routes/contactRoutes.js'
import financeRouter from './routes/financeRoutes.js'
import { taxonomyRouter, coverRouter, settingsRouter } from './routes/taxonomyRoutes.js'
import { publicApplicationRouter, staffApplicationRouter } from './routes/applicationRoutes.js'
import { publicGovernanceRouter, staffGovernanceRouter } from './routes/governanceRoutes.js'

// ── App setup ─────────────────────────────────────────────────────────────────
export const app = express()
app.disable('x-powered-by')

if (config.TRUST_PROXY > 0) app.set('trust proxy', config.TRUST_PROXY)

app.use(
  helmet(),
  cors({
    origin: (origin, callback) => callback(null, !origin || isTrustedOrigin(origin)),
    credentials: true,
  }),
  express.json({ limit: '10mb' }),
  cookieParser(),
)

// Origin guard for mutating API requests
app.use('/api', (req, _res, next) => {
  if (
    !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
    req.headers.origin &&
    !isTrustedOrigin(req.headers.origin)
  )
    return next(new ApiError(403, 'Untrusted request origin'))
  next()
})

// ── Root info & Health check ──────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({
    name: 'Library Management System API (Biblioteca)',
    version: '1.0.0',
    status: 'running',
    health: '/api/health',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      loans: '/api/loans',
      reservations: '/api/reservations',
      fines: '/api/fines',
      members: '/api/staff/members',
      reports: '/api/staff/reports',
      announcements: '/api/announcements',
    },
  }),
)

app.get('/api/health', (_req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'database_unavailable' }),
)

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/books', bookRouter)
app.use('/api/staff/books', bookRouter)
app.use('/api/staff/copies', bookCopyRouter)
app.use('/api/staff', taxonomyRouter)
app.use('/api/covers', coverRouter)
app.use('/api/library', settingsRouter)
app.use('/api/loans', borrowingRouter)
app.use('/api/staff/loans', borrowingRouter)
app.use('/api/reservations', reservationRouter)
app.use('/api/staff/reservations', reservationRouter)
app.use('/api/fines', fineRouter)
app.use('/api/staff/members', memberRouter)
app.use('/api/staff/reports', reportRouter)
app.use('/api/announcements', announcementRouter)
app.use('/api/me', meRouter)
app.use('/api/library/content', announcementRouter)
app.use('/api/staff/content', staffContentRouter)
app.use('/api/library/applications', publicApplicationRouter)
app.use('/api/applications', publicApplicationRouter)
app.use('/api/staff/applications', staffApplicationRouter)
app.use('/api/staff/acquisitions', acquisitionRouter)
app.use('/api/contact', publicContactRouter)
app.use('/api/staff/contact', staffContactRouter)
app.use('/api/staff/finance', financeRouter)
app.use('/api/library/policies', publicPolicyRouter)
app.use('/api/governance', publicGovernanceRouter)
app.use('/api/staff/governance', staffGovernanceRouter)
app.use('/api/notifications', memberNoticeRouter)
// Last of the /api/staff routers: audit history, loan policies, staff notifications.
app.use('/api/staff', staffRouter)

// ── Static client (optional) ──────────────────────────────────────────────────
if (config.SERVE_CLIENT === 'true') {
  const dist = fileURLToPath(new URL('../frontend/dist', import.meta.url))
  app.use(express.static(dist, { index: false, maxAge: '7d', immutable: true }))
  app.get(/^\/(?!api\/).*/, (_req, res) =>
    res.set('Cache-Control', 'no-cache').sendFile(join(dist, 'index.html')),
  )
}

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, _res, next) => next(new ApiError(404, 'Endpoint not found')))

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((error, _req, res, next) => {
  if (res.headersSent) { next(error); return }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
    })
    return
  }
  if (error instanceof ApiError) {
    res.status(error.status).json({ message: error.message })
    return
  }
  if (error?.code === 11000) {
    res.status(409).json({ message: 'This email, ISBN, barcode, or reservation already exists' })
    return
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ message: 'The upload is too large. Images must be no larger than 5 MB.' })
    return
  }
  if (error?.type === 'entity.parse.failed') {
    res.status(400).json({ message: 'Invalid JSON request' })
    return
  }

  console.error(error)
  res.status(500).json({ message: 'An unexpected error occurred. Please try again.' })
})
