import { describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { createCryptoProxy } from '../../../../server/crypto/proxy'
import { assetFixture, globalFixture, historyFixture } from './fixtures'

const ROOT = 'https://api.coingecko.com/api/v3'
const TEST_KEY = 'offline-test-credential-not-a-real-key'
const request = (path: string) =>
  new Request(`http://localhost/api/crypto/${path}`)
describe('secure CoinGecko boundary', () => {
  it('injects authentication only upstream and strips unused fields', async () => {
    server.use(
      http.get(`${ROOT}/coins/markets`, ({ request: req }) => {
        expect(req.headers.get('x-cg-demo-api-key')).toBe(TEST_KEY)
        expect(req.url).not.toContain(TEST_KEY)
        expect(new URL(req.url).searchParams.get('per_page')).toBe('50')
        return HttpResponse.json([
          { ...assetFixture(), private_echo: TEST_KEY },
        ])
      }),
    )
    const response = await createCryptoProxy({ apiKey: TEST_KEY })(
      request('markets?currency=usd'),
    )
    expect(response.status).toBe(200)
    expect(await response.text()).not.toContain(TEST_KEY)
  })
  it.each([
    'markets?url=https://evil.example',
    'markets?currency=eur',
    'markets?currency=usd&currency=usd',
    'markets?page=2',
    'global?currency=usd',
    'coins/btc%2Fusd',
    'coins/bitcoin/history?period=MAX',
    'coins/bitcoin/history?period=1Y&days=9999',
    'coins/bitcoin?ids=ethereum',
    'https://evil.example',
  ])('rejects unsafe parameters %s without fetching', async (path) => {
    const fetcher = vi.fn<typeof fetch>()
    expect(
      (await createCryptoProxy({ apiKey: TEST_KEY, fetcher })(request(path)))
        .status,
    ).toBe(400)
    expect(fetcher).not.toHaveBeenCalled()
  })
  it('rejects non-GET methods', async () => {
    const response = await createCryptoProxy({ apiKey: TEST_KEY })(
      new Request('http://localhost/api/crypto/global', { method: 'POST' }),
    )
    expect(response.status).toBe(405)
  })
  it('reports missing server configuration without network access', async () => {
    const response = await createCryptoProxy({ apiKey: '' })(request('markets'))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      error: { code: 'NOT_CONFIGURED' },
    })
  })
  it.each([401, 403, 500, 404])(
    'safely maps provider status %s without reflecting secrets',
    async (status) => {
      server.use(
        http.get(
          `${ROOT}/global`,
          () => new HttpResponse(TEST_KEY, { status }),
        ),
      )
      const response = await createCryptoProxy({ apiKey: TEST_KEY })(
        request('global'),
      )
      expect(response.status).toBe(status === 404 ? 404 : 502)
      expect(await response.text()).not.toContain(TEST_KEY)
    },
  )
  it('rejects credentials reflected inside valid provider fields', async () => {
    server.use(
      http.get(`${ROOT}/coins/markets`, () =>
        HttpResponse.json([{ ...assetFixture(), name: TEST_KEY }]),
      ),
    )
    const response = await createCryptoProxy({ apiKey: TEST_KEY })(
      request('markets'),
    )
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain(TEST_KEY)
  })
  it('uses fixed endpoint history days and no forced interval', async () => {
    const days: string[] = []
    server.use(
      http.get(`${ROOT}/coins/bitcoin/market_chart`, ({ request: req }) => {
        const url = new URL(req.url)
        days.push(url.searchParams.get('days') ?? '')
        expect(url.searchParams.has('interval')).toBe(false)
        return HttpResponse.json(historyFixture)
      }),
    )
    const handler = createCryptoProxy({ apiKey: TEST_KEY })
    for (const period of ['24H', '7D', '30D', '1Y'])
      expect(
        (await handler(request(`coins/bitcoin/history?period=${period}`)))
          .status,
      ).toBe(200)
    expect(days).toEqual(['1', '7', '30', '365'])
  })
  it('handles unknown assets without substituting Bitcoin', async () => {
    server.use(http.get(`${ROOT}/coins/markets`, () => HttpResponse.json([])))
    expect(
      (await createCryptoProxy({ apiKey: TEST_KEY })(request('coins/unknown')))
        .status,
    ).toBe(404)
  })
  it('rejects invalid provider schemas', async () => {
    server.use(
      http.get(`${ROOT}/global`, () => HttpResponse.json({ data: 'bad' })),
    )
    expect(
      (await createCryptoProxy({ apiKey: TEST_KEY })(request('global'))).status,
    ).toBe(502)
  })
  it('deduplicates concurrent calls and caches until TTL expiry', async () => {
    let calls = 0
    let clock = 0
    server.use(
      http.get(`${ROOT}/global`, () => {
        calls++
        return HttpResponse.json(globalFixture)
      }),
    )
    const handler = createCryptoProxy({ apiKey: TEST_KEY, now: () => clock })
    const responses = await Promise.all([
      handler(request('global')),
      handler(request('global')),
    ])
    expect(await responses[0].json()).toEqual(await responses[1].json())
    await handler(request('global'))
    expect(calls).toBe(1)
    clock = 121000
    await handler(request('global'))
    expect(calls).toBe(2)
  })
  it('respects provider cooldown across endpoints without repeated upstream calls', async () => {
    let calls = 0
    server.use(
      http.get(`${ROOT}/global`, () => {
        calls++
        return new HttpResponse(null, {
          status: 429,
          headers: { 'Retry-After': '120' },
        })
      }),
    )
    const handler = createCryptoProxy({ apiKey: TEST_KEY })
    expect((await handler(request('global'))).headers.get('Retry-After')).toBe(
      '120',
    )
    expect((await handler(request('markets'))).status).toBe(429)
    expect(calls).toBe(1)
  })
  it('does not follow upstream redirects', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (_url, options) => {
        expect(options?.redirect).toBe('error')
        throw new TypeError('redirect failure with secret ' + TEST_KEY)
      })
    const response = await createCryptoProxy({ apiKey: TEST_KEY, fetcher })(
      request('global'),
    )
    expect(response.status).toBe(502)
    expect(await response.text()).not.toContain(TEST_KEY)
  })
  it('maps timeout safely', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new DOMException(TEST_KEY, 'TimeoutError'))
    const response = await createCryptoProxy({ apiKey: TEST_KEY, fetcher })(
      request('global'),
    )
    expect(response.status).toBe(504)
    expect(await response.text()).not.toContain(TEST_KEY)
  })
})
