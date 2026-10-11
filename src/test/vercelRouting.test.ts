import { describe, expect, it } from 'vitest'
import configText from '../../vercel.json?raw'

interface Route {
  src?: string
  dest?: string
  status?: number
  handle?: string
}
const config = JSON.parse(configText) as { routes: Route[] }
// Exercise the committed route ordering. This is an offline routing model,
// not a substitute for the owner's Vercel preview smoke test.
function resolve(path: string, files: string[] = []) {
  for (const route of config.routes) {
    if (route.handle === 'filesystem' && files.includes(path)) return path
    if (route.src && new RegExp(`^${route.src}$`).test(path)) {
      return route.status ?? route.dest
    }
  }
}

describe('Vercel route precedence', () => {
  it.each([
    '/api',
    '/api/crypto',
    '/api/crypto/global',
    '/api/crypto/coins/bitcoin/history',
    '/api/unknown',
  ])('keeps %s out of the SPA fallback', (path) => {
    expect(resolve(path)).toBe('/api/crypto')
  })
  it.each([
    '/',
    '/weather',
    '/currencies',
    '/economy',
    '/crypto/bitcoin',
    '/settings',
    '/not-a-route',
    '/apiculture',
  ])('serves the app shell for %s', (path) => {
    expect(resolve(path)).toBe('/index.html')
  })
  it.each(['/assets/app.js', '/favicon.svg', '/theme.js'])(
    'serves existing file %s before fallback',
    (path) => {
      expect(resolve(path, [path])).toBe(path)
    },
  )
  it('returns 404 for missing build assets', () => {
    expect(resolve('/assets/missing.js')).toBe(404)
  })
})
