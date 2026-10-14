import { app } from './app.js'
import { config } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './database/connection.js'
import { ensureIndexes } from './database/indexes.js'
import { Book } from './models/Book.js'
import { getPolicy } from './models/Fine.js'
import { linkCatalogReferences } from './database/seed.js'
import { startOverdueJob } from './jobs/overdueJob.js'
import { ensureDefaultContent } from './database/defaultContent.js'

// ── Startup ───────────────────────────────────────────────────────────────────
try {
  // 1. Connect to MongoDB (replica-set)
  await connectDatabase()

  // 2. Ensure all model indexes are created
  await ensureIndexes()

  // 3. Ensure the default library policy document exists
  await getPolicy()

  // 4. Sync book ↔ taxonomy virtual references
  await linkCatalogReferences()

  // 4b. Store the default services & welcome notice once, so the home page reads them from the database
  await ensureDefaultContent()

  // 5. Seed sample data in a fresh development environment
  if (config.NODE_ENV === 'development' && (await Book.estimatedDocumentCount()) === 0) {
    const { seedCatalog } = await import('../scripts/seed/seed.js')
    await seedCatalog()
    console.log('Empty development catalog: sample books inserted.')
  }

  // 6. Start the HTTP server
  const server = app.listen(config.PORT, () =>
    console.log(`Biblioteca API  →  http://localhost:${config.PORT}`),
  )

  // 7. Notify staff and members when a loan's borrowing time has ended
  if (config.NODE_ENV !== 'test') startOverdueJob()

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const stop = async () => {
    console.log('\nShutting down…')
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
} catch (error) {
  console.error('API startup failed:', error.message ?? error)
  process.exitCode = 1
}
