import mongoose from 'mongoose'
import * as argon2 from '@node-rs/argon2'
import { config } from '../../backend/config/env.js'
import { User } from '../../backend/models/User.js'

async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@library.com'
  const password = process.env.ADMIN_PASSWORD || 'AdminPassword123!'
  const name = process.env.ADMIN_NAME || 'System Administrator'

  console.log(`Connecting to MongoDB at: ${config.MONGODB_URI}...`)
  await mongoose.connect(config.MONGODB_URI)
  console.log('Connected to MongoDB.')

  const passwordHash = await argon2.hash(password)

  let user = await User.findOne({ email }).select('+passwordHash')
  if (user) {
    user.name = name
    user.role = 'admin'
    user.status = 'active'
    user.emailVerified = true
    user.passwordHash = passwordHash
    await user.save()
    console.log(`Existing user updated to admin: ${email}`)
  } else {
    user = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
      status: 'active',
      emailVerified: true,
      lang: 'en',
    })
    console.log(`New admin user created: ${email}`)
  }

  console.log('-------------------------------------------')
  console.log('Admin Account Credentials:')
  console.log(`Email:    ${email}`)
  console.log(`Password: ${password}`)
  console.log(`Role:     ${user.role}`)
  console.log('-------------------------------------------')

  await mongoose.disconnect()
}

bootstrapAdmin().catch((err) => {
  console.error('Failed to bootstrap admin user:', err)
  process.exit(1)
})
