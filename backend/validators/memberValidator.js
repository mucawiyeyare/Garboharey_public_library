import { z } from 'zod'

export const roles = ['member', 'librarian', 'director', 'admin']

export const memberSchema = z.object({
  name: z.string().trim().min(2).max(100),
  status: z.enum(['active', 'suspended']),
  role: z.enum(roles),
})
