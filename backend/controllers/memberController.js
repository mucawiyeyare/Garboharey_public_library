import { sendSecurityLink } from './authController.js'
import { isAdmin } from '../middleware/authMiddleware.js'
import { pagination, sendPage, textSearch } from '../utils/pagination.js'
import * as argon2 from '@node-rs/argon2'
import { z } from 'zod'
import mongoose from 'mongoose'
import { ApiError, requireRecord } from '../middleware/errorMiddleware.js'
import { Audit } from '../models/AuditLog.js'
import { User } from '../models/User.js'
import { Application } from '../models/Member.js'
import { roles, memberSchema } from '../validators/memberValidator.js'
import { registerSchema } from '../validators/authValidator.js'
import { idSchema } from '../validators/bookValidator.js'
import { Borrowing } from '../models/Borrowing.js'

export const getMembers = async (req, res) => {
  const page = pagination(req, 500),
    search = textSearch(req.query.q)

  let roleQuery = {}
  if (req.query.role) {
    roleQuery = { role: req.query.role }
  } else if (req.query.group === 'team') {
    roleQuery = { role: { $in: ['admin', 'librarian', 'director'] } }
  } else if (req.query.group === 'members') {
    roleQuery = { role: 'member' }
  }

  const filter = {
    ...roleQuery,
    ...(search ? { $or: [{ name: search }, { email: search }] } : {}),
    ...(req.query.status === 'active' ? { status: 'active' } : {}),
  }
  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-savedBooks -circulationVersion')
      .sort({ name: 1, _id: 1 })
      .skip(page.skip)
      .limit(page.limit)
      .lean(),
    User.countDocuments(filter),
  ])

  // Member dashboard summary counts (only when listing members group)
  let summary = null
  if (!req.query.role && req.query.group === 'members') {
    const [activeCount, suspendedCount, pendingCount] = await Promise.all([
      User.countDocuments({ role: 'member', status: 'active' }),
      User.countDocuments({ role: 'member', status: 'suspended' }),
      Application.countDocuments({ status: 'pending' }).catch(() => 0),
    ])
    summary = {
      total: activeCount + suspendedCount,
      active: activeCount,
      suspended: suspendedCount,
      pending: pendingCount,
    }
  }

  sendPage(res, items, total, page, summary ? { summary } : {})
}

export const postMembers = async (req, res) => {
  const input = registerSchema.parse(req.body)
  const role = z.enum(roles).parse(req.body.role ?? 'member')

  // Permission structure:
  // Register staff: Only administrators can create staff accounts
  if (role !== 'member' && !isAdmin(req.user)) {
    throw new ApiError(403, 'Only administrators can create staff accounts')
  }

  // Register new member: Director: Yes | Administrator: Yes | Librarian: No
  if (role === 'member' && req.user.role === 'librarian') {
    throw new ApiError(
      403,
      'Librarians are not authorized to directly register members. New registrations must be processed by the Director or Administrator.',
    )
  }

  const member = await mongoose.connection.transaction(async (session) => {
    const [created] = await User.create(
      [{ ...input, role, passwordHash: await argon2.hash(input.password) }],
      { session },
    )
    await Audit.create(
      [{ actor: req.user.id, action: 'member.created', entity: String(created._id) }],
      { session },
    )
    await sendSecurityLink(created, 'verify', session)
    return created
  })
  res.status(201).json({
    _id: member._id,
    name: member.name,
    email: member.email,
    role: member.role,
    status: member.status,
  })
}

export const patchMembersId = async (req, res) => {
  const id = idSchema.parse(req.params.id),
    input = memberSchema.parse(req.body)
  const member = await mongoose.connection.transaction(async (session) => {
    const current = requireRecord(await User.findById(id).select('+passwordHash').session(session))
    if (id === req.user.id && (input.role !== current.role || input.status !== current.status))
      throw new ApiError(409, 'You cannot change your own access')

    // Permission structure:
    // Only administrators can manage staff roles
    if (!isAdmin(req.user) && (input.role !== current.role || current.role !== 'member')) {
      throw new ApiError(403, 'Only administrators can manage staff accounts and roles')
    }

    // Librarian has limited edit fields: can edit name and email, but cannot suspend/reactivate or change role
    if (req.user.role === 'librarian') {
      if (input.role !== current.role) {
        throw new ApiError(403, 'Librarians cannot change member roles')
      }
      if (input.status !== current.status) {
        throw new ApiError(403, 'Librarians cannot suspend or reactivate members')
      }
    }

    current.name = input.name
    current.status = input.status
    current.role = input.role

    // Allow email update — check for uniqueness
    if (input.email && input.email !== current.email) {
      const existing = await User.findOne({ email: input.email }).session(session).lean()
      if (existing && String(existing._id) !== id)
        throw new ApiError(409, 'This email address is already in use by another account.')
      current.email = input.email
    }

    // Allow password update — hash the new one
    if (input.password) {
      current.passwordHash = await argon2.hash(input.password)
      // Increment authVersion to invalidate all existing sessions
      current.authVersion = (current.authVersion || 0) + 1
    }

    await current.save({ session })
    await Audit.create([{ actor: req.user.id, action: 'member.updated', entity: id }], { session })
    return current
  })
  res.json(member)
}

export const deleteMember = async (req, res) => {
  const id = idSchema.parse(req.params.id)

  if (id === req.user.id) {
    throw new ApiError(400, 'You cannot delete your own account.')
  }

  const target = requireRecord(await User.findById(id))

  // Permissions:
  // Only administrators can delete staff accounts (admin, librarian, director)
  if (target.role !== 'member' && !isAdmin(req.user)) {
    throw new ApiError(403, 'Only administrators can delete staff user accounts.')
  }

  // Deleting a member: Director or Administrator
  if (target.role === 'member' && req.user.role === 'librarian') {
    throw new ApiError(403, 'Librarians are not authorized to delete members.')
  }

  // Check for active loans
  const activeLoans = await Borrowing.countDocuments({ member: id, returnedAt: null })
  if (activeLoans > 0) {
    throw new ApiError(
      400,
      `Cannot delete account: member has ${activeLoans} active borrowed book(s). Please return all books before deleting.`,
    )
  }

  await User.findByIdAndDelete(id)
  await Audit.create([
    {
      actor: req.user.id,
      action: target.role === 'member' ? 'member.deleted' : 'user.deleted',
      entity: id,
    },
  ])

  res.status(204).end()
}
