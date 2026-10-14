import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1, 'Password is required').max(128),
})

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
})

export const bookSchema = z.object({
  coverId: z.string().nullable().optional(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  author: z.string().trim().min(1, 'Author is required').max(150),
  isbn: z.string().trim().min(1, 'ISBN is required').max(30),
  genre: z.string().trim().max(80).optional().default(''),
  category: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  language: z.enum(['en', 'so', 'ar', 'other']).default('en'),
  edition: z.string().trim().max(50).optional().default(''),
  featured: z.boolean().default(false),
  year: z.coerce.number().int().min(1000).max(new Date().getFullYear() + 1),
  description: z.string().trim().max(3000).optional().default(''),
  archived: z.boolean().default(false),
  initialCopies: z.coerce.number().int().min(0).max(1000).optional().default(50),
})

export const policySchema = z.object({
  loanDays: z.coerce.number().int().min(1).default(21),
  maxLoans: z.coerce.number().int().min(1).default(5),
  maxRenewals: z.coerce.number().int().min(0).default(2),
  renewalDays: z.coerce.number().int().min(1).default(14),
  fineEnabled: z.boolean().default(false),
  finePerDay: z.coerce.number().min(0).default(0),
  graceDays: z.coerce.number().int().min(0).default(0),
  maxFine: z.coerce.number().min(0).default(0),
  currency: z.string().default(''),
  reservationHoldDays: z.coerce.number().int().min(0).default(0),
})
