import mongoose from 'mongoose'
import { Category } from '../models/Category.js'
import { Author, nameKey } from '../models/Author.js'
import { Publisher } from '../models/Publisher.js'
import { Cover } from '../models/Cover.js'

// ── Categories ─────────────────────────────────────────────────────────────
export const getCategories = async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : ''
  const filter = q
    ? {
        $or: [
          { 'name.en': { $regex: q, $options: 'i' } },
          { 'name.so': { $regex: q, $options: 'i' } },
          { 'name.ar': { $regex: q, $options: 'i' } },
        ],
      }
    : {}
  const items = await Category.find(filter).sort({ 'name.en': 1, createdAt: -1 }).lean()
  // Ensure name is an object with localized properties
  const formatted = items.map((c) => ({
    ...c,
    name:
      typeof c.name === 'string'
        ? { en: c.name, so: c.name, ar: c.name }
        : { en: c.name?.en || '', so: c.name?.so || '', ar: c.name?.ar || '' },
  }))
  res.json(formatted)
}

export const postCategory = async (req, res) => {
  const { name, description, status = 'active' } = req.body
  const localizedName =
    typeof name === 'string'
      ? { en: name, so: name, ar: name }
      : { en: name?.en || '', so: name?.so || '', ar: name?.ar || '' }
  const localizedDesc =
    typeof description === 'string'
      ? { en: description, so: description, ar: description }
      : { en: description?.en || '', so: description?.so || '', ar: description?.ar || '' }

  const category = await Category.create({
    name: localizedName,
    description: localizedDesc,
    status,
  })
  res.status(201).json(category)
}

export const putCategory = async (req, res) => {
  const { id } = req.params
  const { name, description, status } = req.body
  const update = {}
  if (name) {
    update.name =
      typeof name === 'string'
        ? { en: name, so: name, ar: name }
        : { en: name?.en || '', so: name?.so || '', ar: name?.ar || '' }
  }
  if (description !== undefined) {
    update.description =
      typeof description === 'string'
        ? { en: description, so: description, ar: description }
        : { en: description?.en || '', so: description?.so || '', ar: description?.ar || '' }
  }
  if (status) update.status = status

  const updated = await Category.findByIdAndUpdate(id, { $set: update }, { new: true })
  res.json(updated)
}

export const deleteCategory = async (req, res) => {
  const { id } = req.params
  await Category.findByIdAndUpdate(id, { $set: { status: 'inactive' } })
  res.status(204).end()
}

// ── Publishers ─────────────────────────────────────────────────────────────
export const getPublishers = async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : ''
  const filter = q ? { name: { $regex: q, $options: 'i' }, archived: false } : { archived: false }
  const items = await Publisher.find(filter).sort({ name: 1 }).lean()
  res.json(items)
}

export const postPublisher = async (req, res) => {
  const { name, contact = '' } = req.body
  const trimmed = String(name || '').trim()
  const publisher = await Publisher.findOneAndUpdate(
    { nameKey: nameKey(trimmed) },
    { $set: { name: trimmed, nameKey: nameKey(trimmed), contact, archived: false } },
    { upsert: true, returnDocument: 'after' },
  )
  res.status(201).json(publisher)
}

export const putPublisher = async (req, res) => {
  const { id } = req.params
  const { name, contact } = req.body
  const update = {}
  if (name) {
    update.name = name.trim()
    update.nameKey = nameKey(name.trim())
  }
  if (contact !== undefined) update.contact = contact
  const updated = await Publisher.findByIdAndUpdate(id, { $set: update }, { new: true })
  res.json(updated)
}

export const deletePublisher = async (req, res) => {
  const { id } = req.params
  await Publisher.findByIdAndUpdate(id, { $set: { archived: true } })
  res.status(204).end()
}

// ── Authors ────────────────────────────────────────────────────────────────
export const getAuthors = async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : ''
  const filter = q ? { name: { $regex: q, $options: 'i' }, archived: false } : { archived: false }
  const items = await Author.find(filter).sort({ name: 1 }).lean()
  res.json(items)
}

export const postAuthor = async (req, res) => {
  const { name, biography = '', country = '' } = req.body
  const trimmed = String(name || '').trim()
  const author = await Author.findOneAndUpdate(
    { nameKey: nameKey(trimmed) },
    { $set: { name: trimmed, nameKey: nameKey(trimmed), biography, country, archived: false } },
    { upsert: true, returnDocument: 'after' },
  )
  res.status(201).json(author)
}

export const putAuthor = async (req, res) => {
  const { id } = req.params
  const { name, biography, country } = req.body
  const update = {}
  if (name) {
    update.name = name.trim()
    update.nameKey = nameKey(name.trim())
  }
  if (biography !== undefined) update.biography = biography
  if (country !== undefined) update.country = country
  const updated = await Author.findByIdAndUpdate(id, { $set: update }, { new: true })
  res.json(updated)
}

export const deleteAuthor = async (req, res) => {
  const { id } = req.params
  await Author.findByIdAndUpdate(id, { $set: { archived: true } })
  res.status(204).end()
}

// ── Covers (Images) ────────────────────────────────────────────────────────
export const postCover = async (req, res) => {
  const contentType = req.headers['content-type'] || 'image/jpeg'
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks)
      if (!buffer.length) {
        return res.status(400).json({ message: 'Empty image upload' })
      }
      const cover = await Cover.create({
        data: buffer,
        contentType,
        size: buffer.length,
      })
      res.status(201).json({ coverId: String(cover._id) })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
}

export const getCover = async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).end()
    }
    const cover = await Cover.findById(id).lean()
    if (!cover || !cover.data) {
      return res.status(404).end()
    }
    res.setHeader('Content-Type', cover.contentType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
    res.send(cover.data)
  } catch {
    res.status(404).end()
  }
}

// ── Library Settings ───────────────────────────────────────────────────────
let cachedSettings = {
  name: 'Garbaharey Public Library',
  email: 'info@garbaharey-library.org',
  phone: '+252 61 1234567',
  address: 'Main Street, Garbaharey, Gedo, Somalia',
  hours: 'Saturday – Thursday: 8:00 AM – 6:00 PM',
  timezone: 'Africa/Mogadishu',
  logoId: null,
}

export const getLibrarySettings = (_req, res) => {
  res.json(cachedSettings)
}

export const putLibrarySettings = (req, res) => {
  cachedSettings = { ...cachedSettings, ...req.body }
  res.json(cachedSettings)
}
