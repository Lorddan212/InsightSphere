import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { globalFixture, historyFixture } from './fixtures'

const KEY = 'vercel-offline-test-not-a-real-key'
const ROOT = 'https://api.coingecko.com/api/v3'
const request = (path: string, method = 'GET') =>
  new Request(`https://insightsphere.example${path}`, { method })

async function loadAdapter(key = KEY) {
  vi.resetModules()
  vi.stubEnv('COINGECKO_API_KEY', key)
  return (await import('../../../../api/crypto')).default
}

afterEach(() => vi.unstubAllEnvs())

describe('Vercel crypto adapter', () => {
  it('fails safely without a runtime credential', async () => {
    const adapter = await loadAdapter('')
    const response = await adapter.fetch(request('/api/crypto/global'))
    expect(response.status).toBe(503)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(await response.json()).toMatchObject({
      error: { code: 'NOT_CONFIGURED' },
    })
  })

  it('preserves nested paths and history query parameters', async () => {
    server.use(
      http.get(
        `${ROOT}/coins/bitcoin/market_chart`,
        ({ request: upstream }) => {
          expect(new URL(upstream.url).searchParams.get('days')).toBe('365')
          expect(upstream.headers.get('x-cg-demo-api-key')).toBe(KEY)
          expect(upstream.url).not.toContain(KEY)
          return HttpResponse.json(historyFixture)
        },
      ),
    )
    const adapter = await loadAdapter()
    const response = await adapter.fetch(
      request('/api/crypto/coins/bitcoin/history?period=1Y&currency=usd'),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).not.toContain(KEY)
  })

  it.each([
    '/api/crypto/markets?currency=usd&currency=usd',
    '/api/crypto/global?url=https://evil.example',
    '/api/crypto/unknown',
    '/api/unknown',
  ])('preserves rejection of invalid request %s', async (path) => {
    const adapter = await loadAdapter()
    const response = await adapter.fetch(request(path))
    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('passes unsupported methods to the existing proxy', async () => {
    const adapter = await loadAdapter()
    expect(
      (await adapter.fetch(request('/api/crypto/global', 'POST'))).status,
    ).toBe(405)
  })

  it('retains the cache between requests to the same warm module', async () => {
    let calls = 0
    server.use(
      http.get(`${ROOT}/global`, () => {
        calls++
        return HttpResponse.json(globalFixture)
      }),
    )
    const adapter = await loadAdapter()
    for (let i = 0; i < 2; i++) {
      expect((await adapter.fetch(request('/api/crypto/global'))).status).toBe(
        200,
      )
    }
    expect(calls).toBe(1)
  })

  it('preserves provider throttling status and response headers', async () => {
    server.use(
      http.get(
        `${ROOT}/global`,
        () =>
          new HttpResponse(null, {
            status: 429,
            headers: { 'Retry-After': '120' },
          }),
      ),
    )
    const adapter = await loadAdapter()
    const response = await adapter.fetch(request('/api/crypto/global'))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('120')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).not.toContain(KEY)
  })
})
