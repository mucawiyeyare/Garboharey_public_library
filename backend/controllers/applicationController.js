import mongoose from 'mongoose'
import * as argon2 from '@node-rs/argon2'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { Application } from '../models/Member.js'
import { User } from '../models/User.js'
import { Audit } from '../models/AuditLog.js'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import { sendSecurityLink } from './authController.js'

export const applicationSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(5).max(30),
  email: z.string().trim().email().toLowerCase().max(254).optional().or(z.literal('')),
  password: z.string().min(6).max(128).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().default(''),
  dateOfBirth: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && !isNaN(Date.parse(val)) ? new Date(val) : null)),
  preferredContact: z.enum(['phone', 'email']).optional().default('phone'),
  lang: z.enum(['en', 'so', 'ar']).optional().default('en'),
})

// Public: Submit a new membership application
export const postApplication = async (req, res) => {
  const input = applicationSchema.parse(req.body)

  let candidateEmail = input.email ? input.email.trim().toLowerCase() : ''
  if (!candidateEmail && input.phone) {
    candidateEmail = `member_${input.phone.replace(/[^0-9]/g, '') || Date.now()}@library.local`
  }

  let createdUser = null
  if (candidateEmail) {
    const existing = await User.findOne({ email: candidateEmail })
    if (existing && existing.status === 'active') {
      throw new ApiError(400, 'An active account with this email already exists. Please sign in.')
    }
    if (existing) {
      createdUser = existing
      if (input.password) {
        createdUser.passwordHash = await argon2.hash(input.password)
        await createdUser.save()
      }
    } else {
      const passwordToHash = input.password || 'MemberPassword123!'
      const passwordHash = await argon2.hash(passwordToHash)
      createdUser = await User.create({
        name: input.fullName,
        email: candidateEmail,
        phone: input.phone,
        passwordHash,
        role: 'member',
        status: 'pending',
        emailVerified: false,
        lang: input.lang || 'en',
      })
    }
  }

  const application = await Application.create({
    fullName: input.fullName,
    phone: input.phone,
    email: input.email || '',
    address: input.address || '',
    dateOfBirth: input.dateOfBirth,
    preferredContact: input.preferredContact,
    lang: input.lang,
    status: 'pending',
    member: createdUser ? createdUser._id : null,
  })

  res.status(201).json({
    _id: String(application._id),
    reference: String(application._id),
    status: application.status,
    fullName: application.fullName,
    phone: application.phone,
    email: application.email,
    createdAt: application.createdAt,
    message:
      'Application submitted successfully. Your member account has been created and is pending administrator approval.',
  })
}

// Public: Check application status by reference (ID)
export const getApplicationByRef = async (req, res) => {
  const ref = req.params.ref
  if (!mongoose.Types.ObjectId.isValid(ref)) {
    throw new ApiError(400, 'Invalid application reference number')
  }
  const application = await Application.findById(ref)
  if (!application) {
    throw new ApiError(404, 'Application not found')
  }
  res.json({
    _id: String(application._id),
    reference: String(application._id),
    status: application.status,
    fullName: application.fullName,
    createdAt: application.createdAt,
    reason: application.reason,
  })
}

// Staff: List applications with pagination & filters
export const getStaffApplications = async (req, res) => {
  const page = pagination(req, 25)
  const filter = {}

  if (req.query.status && ['pending', 'approved', 'rejected'].includes(req.query.status)) {
    filter.status = req.query.status
  }

  const search = textSearch(req.query.q)
  if (search) {
    filter.$or = [{ fullName: search }, { phone: search }, { email: search }]
  }

  const [items, total] = await Promise.all([
    Application.find(filter)
      .populate('reviewedBy', 'name email role')
      .populate('member', 'name email role status')
      .sort({ createdAt: -1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    Application.countDocuments(filter),
  ])

  sendPage(res, items, total, page)
}

// Staff: Approve an application and convert applicant into an official library member
export const approveApplication = async (req, res) => {
  const id = req.params.id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid application ID')
  }

  const appRecord = requireRecord(await Application.findById(id), 'Application not found')
  if (appRecord.status === 'approved') {
    throw new ApiError(400, 'Application is already approved')
  }

  const providedEmail = req.body?.email?.trim()?.toLowerCase()
  const candidateEmail =
    providedEmail ||
    appRecord.email?.trim()?.toLowerCase() ||
    `member_${appRecord.phone.replace(/[^0-9]/g, '') || appRecord._id}@library.local`

  if (!candidateEmail) {
    throw new ApiError(400, 'An email address is required to create a member account')
  }

  if (providedEmail && !appRecord.email) {
    appRecord.email = providedEmail
  }

  // Create or activate User
  let user = appRecord.member
    ? await User.findById(appRecord.member)
    : await User.findOne({ email: candidateEmail })
  if (user) {
    user.status = 'active'
    user.emailVerified = true
    await user.save()
  } else {
    // Generate temporary password hash
    const tempPassword = 'MemberPassword123!'
    const passwordHash = await argon2.hash(tempPassword)
    user = await User.create({
      name: appRecord.fullName,
      email: candidateEmail,
      phone: appRecord.phone,
      passwordHash,
      role: 'member',
      status: 'active',
      emailVerified: true,
      lang: appRecord.lang || 'en',
    })

    try {
      await sendSecurityLink(user, 'reset')
    } catch {
      // Ignore security link failures
    }
  }

  appRecord.status = 'approved'
  appRecord.reviewedBy = req.user.id
  appRecord.reviewedAt = new Date()
  appRecord.member = user._id
  await appRecord.save()

  await Audit.create({
    actor: req.user.id,
    action: 'application.approved',
    entity: String(appRecord._id),
  })

  res.json({
    message: 'Application approved. Applicant is now an active library member.',
    application: appRecord,
    member: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  })
}

// Staff: Reject an application
export const rejectApplication = async (req, res) => {
  const id = req.params.id
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, 'Invalid application ID')
  }

  const appRecord = requireRecord(await Application.findById(id), 'Application not found')
  if (appRecord.status === 'approved') {
    throw new ApiError(400, 'Cannot reject an already approved application')
  }

  appRecord.status = 'rejected'
  appRecord.reason = req.body?.reason?.trim() || ''
  appRecord.reviewedBy = req.user.id
  appRecord.reviewedAt = new Date()
  await appRecord.save()

  if (appRecord.member) {
    await User.updateOne({ _id: appRecord.member, status: 'pending' }, { $set: { status: 'suspended' } })
  }

  await Audit.create({
    actor: req.user.id,
    action: 'application.rejected',
    entity: String(appRecord._id),
  })

  res.json({
    message: 'Application rejected.',
    application: appRecord,
  })
}
