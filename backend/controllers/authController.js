import { randomBytes } from 'node:crypto'
import mongoose from 'mongoose'
import * as argon2 from '@node-rs/argon2'
import { z } from 'zod'
import { config } from '../config/env.js'
import { User, RefreshSession, SecurityToken } from '../models/User.js'
import { Audit } from '../models/AuditLog.js'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { clearRefresh, hashToken, issueTokens } from '../middleware/authMiddleware.js'
import { loginSchema, registerSchema } from '../validators/authValidator.js'

export async function sendSecurityLink(user, kind, session, options = {}) {
  const token = randomBytes(32).toString('hex')
  const minutes = options.minutes ?? (kind === 'reset' ? 30 : 1440)
  const expiresAt = new Date(Date.now() + minutes * 60000)
  await SecurityToken.deleteMany({ user: String(user._id), kind }, { session })
  await SecurityToken.create(
    [{ user: String(user._id), kind, tokenHash: hashToken(token), expiresAt }],
    { session },
  )
  const url = `${config.CLIENT_ORIGIN}/${kind === 'reset' ? 'reset-password' : 'verify-email'}?token=${token}`
  console.log(`[AUTH] Security link for ${user.email} (${kind}): ${url}`)
}

export const postRegister = async (req, res) => {
  const input = registerSchema.parse(req.body)
  const user = await mongoose.connection.transaction(async (session) => {
    const [created] = await User.create(
      [
        {
          role: 'member',
          name: input.name,
          email: input.email,
          passwordHash: await argon2.hash(input.password),
        },
      ],
      { session },
    )
    await sendSecurityLink(created, 'verify', session)
    return created
  })
  res.status(201).json(await issueTokens(user, res))
}

const decoy = await argon2.hash('decoy-password-for-timing-only')

export const postLogin = async (req, res) => {
  const input = loginSchema.parse(req.body)
  const user = await User.findOne({ email: input.email }).select('+passwordHash')
  const passwordOk = await argon2.verify(user?.passwordHash ?? decoy, input.password)
  if (!user || !passwordOk)
    throw new ApiError(401, 'Email or password is incorrect, or the account is unavailable')
  if (user.status === 'pending')
    throw new ApiError(
      403,
      'Your account is pending administrator approval. Please wait for library staff to approve your application.',
    )
  if (user.status !== 'active')
    throw new ApiError(401, 'Email or password is incorrect, or the account is unavailable')
  await Audit.create({ actor: user._id, action: 'user.login', entity: String(user._id) })
  res.json(await issueTokens(user, res))
}

export const REUSE_GRACE_MS = 10_000

export const postRefresh = async (req, res) => {
  const token = req.cookies.refreshToken
  if (typeof token !== 'string') throw new ApiError(401, 'Please sign in')
  const now = new Date()
  const session = await RefreshSession.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: now },
  })
  if (session && !session.rotatedAt)
    await RefreshSession.updateOne(
      { _id: session._id },
      { $set: { rotatedAt: now, expiresAt: new Date(now.getTime() + REUSE_GRACE_MS) } },
    )
  if (!session) {
    clearRefresh(res)
    throw new ApiError(401, 'Session expired')
  }
  const user = requireRecord(
    await User.findOne({ _id: session.user, status: 'active' }),
    'Account unavailable',
  )
  if ((session.authVersion ?? 0) !== (user.authVersion ?? 0))
    throw new ApiError(401, 'Session expired')
  res.json(await issueTokens(user, res))
}

export const postLogout = async (req, res) => {
  if (typeof req.cookies.refreshToken === 'string')
    await RefreshSession.deleteOne({ tokenHash: hashToken(req.cookies.refreshToken) })
  clearRefresh(res)
  res.status(204).end()
}

export const forgotPassword = async (req, res) => {
  const { email } = z.object({ email: z.string().trim().email().toLowerCase() }).parse(req.body)
  await mongoose.connection.transaction(async (session) => {
    const user = await User.findOne({ email, status: 'active' }).session(session)
    if (user) await sendSecurityLink(user, 'reset', session)
  })
  res.json({ message: 'If an active account matches this email, a reset link has been queued.' })
}

export const resetPassword = async (req, res) => {
  const input = z
    .object({ token: z.string().regex(/^[a-f0-9]{64}$/), password: z.string().min(12).max(128) })
    .parse(req.body)
  const passwordHash = await argon2.hash(input.password)
  await mongoose.connection.transaction(async (session) => {
    const token = await SecurityToken.findOneAndDelete(
      { kind: 'reset', tokenHash: hashToken(input.token), expiresAt: { $gt: new Date() } },
      { session },
    )
    if (!token) throw new ApiError(400, 'This reset link is invalid or expired. Request a new one.')
    const user = await User.findOneAndUpdate(
      { _id: token.user, status: 'active' },
      { $set: { passwordHash }, $inc: { authVersion: 1 } },
      { session, returnDocument: 'after' },
    )
    if (!user) throw new ApiError(400, 'Account unavailable')
    await RefreshSession.deleteMany({ user: token.user }, { session })
  })
  clearRefresh(res)
  res.json({ message: 'Password updated. Sign in with your new password.' })
}

export const verifyEmail = async (req, res) => {
  const { token } = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).parse(req.body)
  await mongoose.connection.transaction(async (session) => {
    const link = await SecurityToken.findOneAndDelete(
      { kind: 'verify', tokenHash: hashToken(token), expiresAt: { $gt: new Date() } },
      { session },
    )
    if (!link) throw new ApiError(400, 'This verification link is invalid or expired.')
    await User.updateOne({ _id: link.user }, { $set: { emailVerified: true } }, { session })
  })
  res.json({ message: 'Your email is verified.' })
}

export const resendVerification = async (req, res) => {
  await mongoose.connection.transaction(async (session) => {
    const user = await User.findById(req.user.id).session(session)
    if (user && !user.emailVerified) await sendSecurityLink(user, 'verify', session)
  })
  res.json({ message: 'A verification link has been queued if your email is not yet verified.' })
}
