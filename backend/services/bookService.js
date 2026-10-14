import { Author, nameKey } from '../models/Author.js'
import { Category } from '../models/Category.js'
import { ApiError } from '../middleware/errorMiddleware.js'

export async function authorIdsFor(names, session) {
  if (!names) return []
  const ids = []
  for (const raw of String(names).split(',')) {
    const name = raw.trim().replace(/\s+/g, ' ')
    if (!name) continue
    const author = await Author.findOneAndUpdate(
      { nameKey: nameKey(name) },
      { $setOnInsert: { name, nameKey: nameKey(name) } },
      { upsert: true, returnDocument: 'after', session },
    )
    ids.push(author._id)
  }
  return ids
}

export async function resolveBookInput(input, session) {
  const fields = { ...input, authors: await authorIdsFor(input.author, session) }
  if (input.category) {
    const category = await Category.findById(input.category).session(session)
    if (!category || category.status !== 'active')
      throw new ApiError(400, 'Choose an active category.')
    fields.genre = category.name?.en || ''
  } else {
    fields.category = null
  }
  fields.publisher = input.publisher || null
  return fields
}
