import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import {
  CRYPTO_ERRORS,
  PERIOD_DAYS,
  coinIdSchema,
  globalSchema,
  historySchema,
  marketsSchema,
} from '../schemas/crypto.schemas'
import {
  formatChange,
  formatCompact,
  formatPrice,
  formatUpdated,
  normalizeAsset,
  normalizeGlobal,
  normalizeHistory,
  periodChange,
  safeCoinImage,
} from '../utils/crypto'
import {
  fetchAsset,
  fetchGlobal,
  fetchHistory,
  fetchMarkets,
} from '../api/crypto.api'
import {
  assetFixture,
  cryptoError,
  globalFixture,
  historyFixture,
} from './fixtures'

describe('crypto contracts and calculations', () => {
  it('normalizes market identity, rank and metrics without using symbol as ID', () => {
    const raw = marketsSchema.parse([assetFixture()])[0]
    expect(normalizeAsset(raw)).toMatchObject({
      id: 'bitcoin',
      symbol: 'BTC',
      rank: 1,
      price: 67450.23,
      marketCap: 1320000000000,
    })
  })
  it('retains nullable metrics and an unavailable rank', () => {
    const row = {
      ...assetFixture(),
      market_cap_rank: null,
      current_price: null,
      total_volume: null,
      last_updated: null,
    }
    expect(normalizeAsset(marketsSchema.parse([row])[0])).toMatchObject({
      rank: null,
      price: null,
      volume: null,
      updatedAt: null,
    })
  })
  it.each([0, -1, 1.5])('rejects invalid provider rank %s', (rank) => {
    expect(
      marketsSchema.safeParse([{ ...assetFixture(), market_cap_rank: rank }])
        .success,
    ).toBe(false)
  })
  it.each(['NaN', Infinity, -2])('rejects invalid price %s', (price) => {
    expect(
      marketsSchema.safeParse([{ ...assetFixture(), current_price: price }])
        .success,
    ).toBe(false)
  })
  it('rejects duplicate identities and invalid timestamps', () => {
    expect(
      marketsSchema.safeParse([assetFixture(), assetFixture()]).success,
    ).toBe(false)
    expect(
      marketsSchema.safeParse([{ ...assetFixture(), last_updated: 'bad date' }])
        .success,
    ).toBe(false)
  })
  it('sorts history, deduplicates timestamps and preserves null gaps', () => {
    expect(
      normalizeHistory(
        historySchema.parse({
          prices: [
            [3000, 3],
            [1000, 1],
            [2000, null],
            [3000, 4],
          ],
        }),
      ),
    ).toEqual([
      { timestamp: 1000, price: 1 },
      { timestamp: 2000, price: null },
      { timestamp: 3000, price: 4 },
    ])
  })
  it.each([
    { prices: [[1]] },
    { prices: [['1', 3]] },
    { prices: [[1, Infinity]] },
    { prices: [[9e15, 1]] },
  ])('rejects malformed history %j', (raw) => {
    expect(historySchema.safeParse(raw).success).toBe(false)
  })
  it.each([
    ['24H', 1],
    ['7D', 7],
    ['30D', 30],
    ['1Y', 365],
  ] as const)('maps %s to %s days', (period, days) => {
    expect(PERIOD_DAYS[period]).toBe(days)
  })
  it('formats large and tiny prices without rounding tiny tokens to zero', () => {
    expect(formatPrice(67450.23)).toBe('$67,450.23')
    expect(formatPrice(0.00001234)).toBe('$0.00001234')
    expect(formatPrice(1e-12)).toBe('$1.0000e-12')
    expect(formatPrice(0)).toBe('$0.00')
  })
  it('formats market cap and volume with compact units', () => {
    expect(formatCompact(1320000000000)).toBe('$1.32T')
    expect(formatCompact(42600000000)).toBe('$42.6B')
    expect(formatCompact(19800000, false)).toBe('19.8M')
  })
  it('formats missing values safely and signs both directions', () => {
    expect(formatPrice(null)).toBe('Unavailable')
    expect(formatCompact(Infinity)).toBe('Unavailable')
    expect(formatChange(2)).toBe('+2.00%')
    expect(formatChange(-2)).toBe('-2.00%')
    expect(formatUpdated('invalid')).toBe('Update time unavailable')
  })
  it('calculates a distinct historical period change', () => {
    expect(
      periodChange(normalizeHistory(historySchema.parse(historyFixture))),
    ).toBe(20)
  })
  it.each(
    [
      [],
      [{ timestamp: 1, price: 2 }],
      [
        { timestamp: 1, price: 0 },
        { timestamp: 2, price: 10 },
      ],
      [
        { timestamp: 1, price: null },
        { timestamp: 2, price: 10 },
      ],
    ].map((points) => ({ points })),
  )('protects unavailable period changes %j', ({ points }) => {
    expect(periodChange(points)).toBeNull()
  })
  it('normalizes global units and nullable dominance', () => {
    expect(normalizeGlobal(globalSchema.parse(globalFixture))).toEqual({
      marketCap: 2500000000000,
      volume: 100000000000,
      bitcoinDominance: 53,
      ethereumDominance: 12,
      updatedAt: 1790769600000,
    })
    expect(
      normalizeGlobal(
        globalSchema.parse({
          data: {
            total_market_cap: {},
            total_volume: {},
            market_cap_percentage: {},
            updated_at: null,
          },
        }),
      ).volume,
    ).toBeNull()
  })
  it.each([
    'https://evil.example/coin.png',
    'javascript:alert(1)',
    'http://coin-images.coingecko.com/a.png',
  ])('drops unsafe image %s', (url) => {
    expect(safeCoinImage(url)).toBeNull()
  })
  it('accepts a provider HTTPS logo', () => {
    expect(safeCoinImage('https://coin-images.coingecko.com/coins/a.png')).toBe(
      'https://coin-images.coingecko.com/coins/a.png',
    )
  })
  it.each(['../bitcoin', 'BTC/USD', 'https://evil.example', 'a'.repeat(101)])(
    'rejects invalid asset ID %s',
    (id) => {
      expect(coinIdSchema.safeParse(id).success).toBe(false)
    },
  )
})
describe('same-origin crypto service', () => {
  it('sends no credentials and normalizes market results', async () => {
    server.use(
      http.get('*/api/crypto/markets', ({ request }) => {
        expect(request.headers.has('x-cg-demo-api-key')).toBe(false)
        expect(new URL(request.url).search).toBe('?currency=usd')
        return HttpResponse.json([assetFixture()])
      }),
    )
    expect((await fetchMarkets())[0].id).toBe('bitcoin')
  })
  it('uses exact asset IDs and checks returned identity', async () => {
    server.use(
      http.get('*/api/crypto/coins/ethereum', () =>
        HttpResponse.json([assetFixture()]),
      ),
    )
    await expect(fetchAsset('ethereum')).rejects.toThrow(
      CRYPTO_ERRORS.INVALID_DATA,
    )
  })
  it('rejects invalid IDs before making requests', async () => {
    await expect(fetchAsset('../oops')).rejects.toThrow(
      CRYPTO_ERRORS.INVALID_INPUT,
    )
  })
  it('normalizes history and global responses', async () => {
    server.use(
      http.get('*/api/crypto/coins/bitcoin/history', ({ request }) => {
        expect(new URL(request.url).searchParams.get('period')).toBe('1Y')
        return HttpResponse.json(historyFixture)
      }),
      http.get('*/api/crypto/global', () => HttpResponse.json(globalFixture)),
    )
    expect(await fetchHistory('bitcoin', '1Y')).toHaveLength(3)
    expect((await fetchGlobal()).bitcoinDominance).toBe(53)
  })
  it.each([
    ['RATE_LIMIT', 429],
    ['NOT_CONFIGURED', 503],
    ['AUTH', 502],
    ['NOT_FOUND', 404],
  ] as const)('maps safe %s errors', async (code, status) => {
    server.use(
      http.get('*/api/crypto/markets', () =>
        HttpResponse.json(cryptoError(code), { status }),
      ),
    )
    await expect(fetchMarkets()).rejects.toThrow(CRYPTO_ERRORS[code])
  })
  it('rejects malformed response data', async () => {
    server.use(
      http.get('*/api/crypto/markets', () => HttpResponse.json({ prices: [] })),
    )
    await expect(fetchMarkets()).rejects.toThrow(CRYPTO_ERRORS.INVALID_DATA)
  })
  it('handles a network failure', async () => {
    server.use(http.get('*/api/crypto/markets', () => HttpResponse.error()))
    await expect(fetchMarkets()).rejects.toMatchObject({ kind: 'network' })
  })
})
