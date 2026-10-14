/**
 * MongoDB connection configuration.
 * These options are passed to mongoose.connect() via database/connection.js.
 *
 * The library requires a replica set so that multi-document transactions
 * (e.g. checkout + fine creation) are atomic.
 *
 * Local development:  mongodb://127.0.0.1:27018/biblioteca?replicaSet=biblioteca-rs
 *   → Start with:  npm run db:start  (spins up a dedicated local replica set on port 27018)
 *
 * Production:  set MONGODB_URI in server/.env to your Atlas or self-hosted replica set URI
 */
export const mongooseOptions = {
  // How long to wait for a server to be found before throwing
  serverSelectionTimeoutMS: 10_000,
  // How long to wait for a single socket operation
  socketTimeoutMS: 45_000,
  // Maximum number of connections in the pool
  maxPoolSize: 10,
  // Minimum number of connections kept open
  minPoolSize: 2,
}
