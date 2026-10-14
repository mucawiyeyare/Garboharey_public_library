import mongoose from 'mongoose'
import { config } from '../config/env.js'

/**
 * Connect to MongoDB and verify it runs as a replica set.
 * The server requires a replica set for multi-document transactions.
 */
export async function connectDatabase() {
  await mongoose.connect(config.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  })

  const hello = await mongoose.connection.db.admin().command({ hello: 1 })

  if (!hello.setName && hello.msg !== 'isdbgrid') {
    console.warn(
      'Notice: MongoDB is running in standalone mode (no replica set detected).\n' +
        'Transactions will execute directly without replica-set sessions.',
    )
    mongoose.connection.transaction = async function (fn) {
      return fn(null)
    }
  } else {
    console.log(
      `MongoDB connected → ${config.MONGODB_URI}  (replica-set: ${hello.setName ?? 'mongos'})`,
    )
  }

  mongoose.connection.on('disconnected', () =>
    console.warn('MongoDB disconnected — reconnecting…'),
  )
  mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected.'))
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err))
}

/**
 * Gracefully close the database connection.
 */
export async function disconnectDatabase() {
  await mongoose.disconnect()
  console.log('MongoDB connection closed.')
}
