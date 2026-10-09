import { z } from 'zod'
import {
  coinIdSchema,
  periodSchema,
  PERIOD_DAYS,
  marketsSchema,
  historySchema,
  globalSchema,
  CRYPTO_ERRORS,
} from '../../src/features/crypto/schemas/crypto.schemas.ts'
import type { CryptoErrorCode } from '../../src/features/crypto/schemas/crypto.schemas.ts'

const ROOT = 'https://api.coingecko.com/api/v3'
interface Route {
  path: string
  params: Record<string, string>
  schema: z.ZodType
  ttl: number
  assetId?: string
}
function routeRequest(url: URL): Route | null {
  const match = /^\/api\/crypto\/coins\/([^/]+)(\/history)?$/.exec(url.pathname)
  const allowed =
    url.pathname === '/api/crypto/global'
      ? []
      : match?.[2]
        ? ['currency', 'period']
        : ['currency']
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1)
      return null
  }
  if (
    url.searchParams.has('currency') &&
    url.searchParams.get('currency') !== 'usd'
  )
    return null
  if (url.pathname === '/api/crypto/global')
    return { path: '/global', params: {}, schema: globalSchema, ttl: 120000 }
  const params = {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: '50',
    page: '1',
    sparkline: 'false',
    precision: 'full',
  }
  if (url.pathname === '/api/crypto/markets')
    return { path: '/coins/markets', params, schema: marketsSchema, ttl: 60000 }
  if (!match || !coinIdSchema.safeParse(match[1]).success) return null
  const id = match[1]
  if (!match[2])
    return {
      path: '/coins/markets',
      params: { ...params, ids: id },
      schema: marketsSchema,
      ttl: 60000,
      assetId: id,
    }
  const period = periodSchema.safeParse(url.searchParams.get('period'))
  if (!period.success) return null
  return {
    path: `/coins/${id}/market_chart`,
    params: {
      vs_currency: 'usd',
      days: String(PERIOD_DAYS[period.data]),
      precision: 'full',
    },
    schema: historySchema,
    ttl: 300000,
  }
}
function failure(
  status: number,
  code: CryptoErrorCode,
  retryAfter?: number,
): Response {
  return Response.json(
    { error: { code, message: CRYPTO_ERRORS[code] } },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
        ...(retryAfter ? { 'Retry-After': String(retryAfter) } : {}),
      },
    },
  )
}

/** Server only. No request headers, URLs, error bodies or secrets are echoed. */
export function createCryptoProxy(options: {
  apiKey: string
  fetcher?: typeof fetch
  now?: () => number
}) {
  const fetcher = options.fetcher ?? fetch
  const now = options.now ?? Date.now
  const cache = new Map<string, { body: string; expires: number }>()
  const pending = new Map<string, Promise<Response>>()
  let cooldownUntil = 0
  let windowStart = now()
  let calls = 0
  async function upstream(route: Route, url: URL): Promise<Response> {
    try {
      const response = await fetcher(url, {
        headers: {
          Accept: 'application/json',
          'x-cg-demo-api-key': options.apiKey,
        },
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      })
      if (response.status === 429) {
        const raw = response.headers.get('Retry-After')
        const seconds =
          raw && /^\d+$/.test(raw)
            ? Number(raw)
            : raw
              ? (Date.parse(raw) - now()) / 1000
              : 60
        const wait = Number.isFinite(seconds)
          ? Math.min(3600, Math.max(60, Math.ceil(seconds)))
          : 60
        cooldownUntil = now() + wait * 1000
        return failure(429, 'RATE_LIMIT', wait)
      }
      if ([401, 403].includes(response.status)) return failure(502, 'AUTH')
      if (response.status === 404) return failure(404, 'NOT_FOUND')
      if (!response.ok) return failure(502, 'PROVIDER')
      const raw: unknown = await response.json()
      const parsed = route.schema.safeParse(raw)
      if (!parsed.success) return failure(502, 'INVALID_DATA')
      if (route.assetId) {
        const assets = marketsSchema.parse(parsed.data)
        if (assets.length === 0) return failure(404, 'NOT_FOUND')
        if (assets.length !== 1 || assets[0].id !== route.assetId)
          return failure(502, 'INVALID_DATA')
      }
      const body = JSON.stringify(parsed.data)
      // Even a malformed provider response must not reflect our credential.
      if (body.includes(options.apiKey)) return failure(502, 'INVALID_DATA')
      if (cache.size >= 128) {
        const oldest = cache.keys().next().value
        if (oldest) cache.delete(oldest)
      }
      cache.set(url.href, { body, expires: now() + route.ttl })
      return new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    } catch (error) {
      // DOMException can originate in another realm (for example jsdom).
      const timedOut =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'TimeoutError'
      return failure(timedOut ? 504 : 502, timedOut ? 'TIMEOUT' : 'PROVIDER')
    }
  }
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET') return failure(405, 'METHOD')
    const route = routeRequest(new URL(request.url))
    if (!route) return failure(400, 'INVALID_INPUT')
    if (!options.apiKey.trim()) return failure(503, 'NOT_CONFIGURED')
    const url = new URL(`${ROOT}${route.path}`)
    url.search = new URLSearchParams(route.params).toString()
    const cached = cache.get(url.href)
    if (cached && cached.expires > now())
      return new Response(cached.body, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    if (cached) cache.delete(url.href)
    const existing = pending.get(url.href)
    if (existing) return (await existing).clone()
    if (now() < cooldownUntil)
      return failure(
        429,
        'RATE_LIMIT',
        Math.ceil((cooldownUntil - now()) / 1000),
      )
    if (now() - windowStart >= 60000) {
      windowStart = now()
      calls = 0
    }
    if (calls >= 30 || pending.size >= 4) return failure(429, 'RATE_LIMIT', 60)
    calls++
    const result = upstream(route, url)
    pending.set(url.href, result)
    try {
      return (await result).clone()
    } finally {
      pending.delete(url.href)
    }
  }
}
