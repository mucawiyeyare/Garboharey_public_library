import { Founder } from '../models/Founder.js'
import { BoardMember } from '../models/BoardMember.js'
import { DirectorMessage } from '../models/DirectorMessage.js'
import { ApiError } from '../middleware/errorMiddleware.js'

// ─────────────────────────────────────────────────────────────────────────────
// FOUNDERS
// ─────────────────────────────────────────────────────────────────────────────

// Public: Only published founders
export const getPublicFounders = async (req, res) => {
  const founders = await Founder.find({ status: 'Published' })
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean()
  res.json(founders)
}

// Staff: All founders (with optional filtering)
export const getStaffFounders = async (req, res) => {
  const { status, q } = req.query
  const filter = {}
  if (status && status !== 'all') {
    filter.status = status
  }
  if (q && q.trim()) {
    filter.$or = [
      { fullName: { $regex: q.trim(), $options: 'i' } },
      { role: { $regex: q.trim(), $options: 'i' } },
      { biography: { $regex: q.trim(), $options: 'i' } },
    ]
  }
  const founders = await Founder.find(filter)
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean()

  const counts = {
    total: await Founder.countDocuments({ status: { $ne: 'Archived' } }),
    published: await Founder.countDocuments({ status: 'Published' }),
    draft: await Founder.countDocuments({ status: 'Draft' }),
    archived: await Founder.countDocuments({ status: 'Archived' }),
  }

  res.json({ items: founders, counts })
}

export const postFounder = async (req, res) => {
  const { fullName, role, photo = '', biography = '', displayOrder = 0, status = 'Published' } = req.body
  if (!fullName || !String(fullName).trim()) {
    throw new ApiError(400, "Founder's full name is required.")
  }
  if (!role || !String(role).trim()) {
    throw new ApiError(400, "Founder's role is required.")
  }

  const founder = await Founder.create({
    fullName: String(fullName).trim(),
    role: String(role).trim(),
    photo: String(photo || '').trim(),
    biography: String(biography || '').trim(),
    displayOrder: Number(displayOrder) || 0,
    status: ['Draft', 'Published', 'Archived'].includes(status) ? status : 'Published',
    createdBy: req.user?._id || null,
  })

  res.status(201).json(founder)
}

export const putFounder = async (req, res) => {
  const { id } = req.params
  const { fullName, role, photo, biography, displayOrder, status } = req.body

  const update = {}
  if (fullName !== undefined) update.fullName = String(fullName).trim()
  if (role !== undefined) update.role = String(role).trim()
  if (photo !== undefined) update.photo = String(photo).trim()
  if (biography !== undefined) update.biography = String(biography).trim()
  if (displayOrder !== undefined) update.displayOrder = Number(displayOrder) || 0
  if (status !== undefined && ['Draft', 'Published', 'Archived'].includes(status)) {
    update.status = status
  }

  const updated = await Founder.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
  if (!updated) throw new ApiError(404, 'Founder profile not found')

  res.json(updated)
}

export const patchFounderStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  if (!['Draft', 'Published', 'Archived'].includes(status)) {
    throw new ApiError(400, 'Invalid status value')
  }
  const updated = await Founder.findByIdAndUpdate(id, { $set: { status } }, { new: true })
  if (!updated) throw new ApiError(404, 'Founder profile not found')
  res.json(updated)
}

export const deleteFounder = async (req, res) => {
  const { id } = req.params
  const hard = req.query.hard === 'true'

  if (hard) {
    await Founder.findByIdAndDelete(id)
  } else {
    // Soft archive by default to preserve institutional history
    await Founder.findByIdAndUpdate(id, { $set: { status: 'Archived' } })
  }

  res.status(204).end()
}

// ─────────────────────────────────────────────────────────────────────────────
// BOARD OF DIRECTORS
// ─────────────────────────────────────────────────────────────────────────────

// Public: Only published board members
export const getPublicBoardMembers = async (req, res) => {
  const members = await BoardMember.find({ status: 'Published' })
    .sort({ isCurrent: -1, displayOrder: 1, createdAt: 1 })
    .lean()
  res.json(members)
}

// Staff: All board members
export const getStaffBoardMembers = async (req, res) => {
  const { status, isCurrent, q } = req.query
  const filter = {}
  if (status && status !== 'all') {
    filter.status = status
  }
  if (isCurrent === 'true') filter.isCurrent = true
  if (isCurrent === 'false') filter.isCurrent = false

  if (q && q.trim()) {
    filter.$or = [
      { fullName: { $regex: q.trim(), $options: 'i' } },
      { role: { $regex: q.trim(), $options: 'i' } },
      { biography: { $regex: q.trim(), $options: 'i' } },
    ]
  }

  const members = await BoardMember.find(filter)
    .sort({ isCurrent: -1, displayOrder: 1, createdAt: 1 })
    .lean()

  const counts = {
    total: await BoardMember.countDocuments({ status: { $ne: 'Archived' } }),
    current: await BoardMember.countDocuments({ isCurrent: true, status: { $ne: 'Archived' } }),
    former: await BoardMember.countDocuments({ isCurrent: false, status: { $ne: 'Archived' } }),
    published: await BoardMember.countDocuments({ status: 'Published' }),
    draft: await BoardMember.countDocuments({ status: 'Draft' }),
    archived: await BoardMember.countDocuments({ status: 'Archived' }),
  }

  res.json({ items: members, counts })
}

export const postBoardMember = async (req, res) => {
  const {
    fullName,
    role,
    photo = '',
    biography = '',
    termStartDate = null,
    termEndDate = null,
    isCurrent = true,
    displayOrder = 0,
    status = 'Published',
  } = req.body

  if (!fullName || !String(fullName).trim()) {
    throw new ApiError(400, "Board member's full name is required.")
  }
  if (!role || !String(role).trim()) {
    throw new ApiError(400, "Board member's role or official title is required.")
  }

  const member = await BoardMember.create({
    fullName: String(fullName).trim(),
    role: String(role).trim(),
    photo: String(photo || '').trim(),
    biography: String(biography || '').trim(),
    termStartDate: termStartDate ? new Date(termStartDate) : null,
    termEndDate: termEndDate ? new Date(termEndDate) : null,
    isCurrent: Boolean(isCurrent),
    displayOrder: Number(displayOrder) || 0,
    status: ['Draft', 'Published', 'Archived'].includes(status) ? status : 'Published',
    createdBy: req.user?._id || null,
  })

  res.status(201).json(member)
}

export const putBoardMember = async (req, res) => {
  const { id } = req.params
  const {
    fullName,
    role,
    photo,
    biography,
    termStartDate,
    termEndDate,
    isCurrent,
    displayOrder,
    status,
  } = req.body

  const update = {}
  if (fullName !== undefined) update.fullName = String(fullName).trim()
  if (role !== undefined) update.role = String(role).trim()
  if (photo !== undefined) update.photo = String(photo).trim()
  if (biography !== undefined) update.biography = String(biography).trim()
  if (termStartDate !== undefined) update.termStartDate = termStartDate ? new Date(termStartDate) : null
  if (termEndDate !== undefined) update.termEndDate = termEndDate ? new Date(termEndDate) : null
  if (isCurrent !== undefined) update.isCurrent = Boolean(isCurrent)
  if (displayOrder !== undefined) update.displayOrder = Number(displayOrder) || 0
  if (status !== undefined && ['Draft', 'Published', 'Archived'].includes(status)) {
    update.status = status
  }

  const updated = await BoardMember.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true })
  if (!updated) throw new ApiError(404, 'Board member profile not found')

  res.json(updated)
}

export const patchBoardMemberStatus = async (req, res) => {
  const { id } = req.params
  const { status, isCurrent } = req.body
  const update = {}
  if (status && ['Draft', 'Published', 'Archived'].includes(status)) {
    update.status = status
  }
  if (isCurrent !== undefined) {
    update.isCurrent = Boolean(isCurrent)
  }
  const updated = await BoardMember.findByIdAndUpdate(id, { $set: update }, { new: true })
  if (!updated) throw new ApiError(404, 'Board member not found')
  res.json(updated)
}

export const deleteBoardMember = async (req, res) => {
  const { id } = req.params
  const hard = req.query.hard === 'true'

  if (hard) {
    await BoardMember.findByIdAndDelete(id)
  } else {
    await BoardMember.findByIdAndUpdate(id, { $set: { status: 'Archived' } })
  }

  res.status(204).end()
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECTOR'S MESSAGE
// ─────────────────────────────────────────────────────────────────────────────

export const getDirectorMessage = async (req, res) => {
  let doc = await DirectorMessage.findOne().sort({ createdAt: -1 })
  if (!doc) {
    doc = await DirectorMessage.create({})
  }
  res.json(doc)
}

export const putDirectorMessage = async (req, res) => {
  const { title, quoteSomali, message, directorName, directorTitle, photo } = req.body
  const update = {
    updatedBy: req.user?._id || null,
  }
  if (title !== undefined) update.title = String(title).trim()
  if (quoteSomali !== undefined) update.quoteSomali = String(quoteSomali).trim()
  if (message !== undefined) update.message = String(message).trim()
  if (directorName !== undefined) update.directorName = String(directorName).trim()
  if (directorTitle !== undefined) update.directorTitle = String(directorTitle).trim()
  if (photo !== undefined) update.photo = String(photo).trim()

  let doc = await DirectorMessage.findOne().sort({ createdAt: -1 })
  if (!doc) {
    doc = await DirectorMessage.create(update)
  } else {
    doc = await DirectorMessage.findByIdAndUpdate(doc._id, { $set: update }, { new: true })
  }

  res.json(doc)
}
