import { config } from './env.js'

export function isTrustedOrigin(origin) {
  if (!origin) return true
  if (origin === config.CLIENT_ORIGIN) return true
  if (config.NODE_ENV === 'production') return false
  try {
    const incoming = new URL(origin)
    const configured = new URL(config.CLIENT_ORIGIN)
    const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])
    return (
      localHosts.has(incoming.hostname) &&
      localHosts.has(configured.hostname) &&
      incoming.protocol === configured.protocol &&
      incoming.port === configured.port &&
      incoming.origin === origin
    )
  } catch {
    return false
  }
}

export const corsOptions = {
  origin: (origin, callback) => callback(null, isTrustedOrigin(origin)),
  credentials: true,
}
