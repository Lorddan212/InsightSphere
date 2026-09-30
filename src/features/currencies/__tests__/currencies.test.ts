import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { ApiError, retryTransientError } from '../../../lib/api/request'
import {
  CURRENCY_ENDPOINT,
  fetchCurrencies,
  fetchHistoricalRates,
  fetchLatestRate,
} from '../api/currencies.api'
import { currencyKeys } from '../api/currencies.keys'
import { rateSchema, selectionSchema } from '../schemas/currencies.schema'
import {
  calculateCurrencyMetrics,
  convertCurrency,
  parseCurrencyAmount,
} from '../utils/currencyCalculations'
import { formatMoney, formatRate } from '../utils/currencyFormatters'
import { getCurrencyDateRange } from '../utils/currencyPeriods'
import { resolveCurrencySelection } from '../hooks/useCurrencySelection'

const range = { from: '2026-09-24', to: '2026-09-30' }
const row = { date: '2026-09-30', base: 'USD', quote: 'NGN', rate: 1300 }

describe('currency contract', () => {
  it('normalizes and sorts supported currencies', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () =>
        HttpResponse.json([
          { iso_code: 'usd', name: 'US Dollar' },
          { iso_code: 'NGN', name: 'Nigerian Naira' },
        ]),
      ),
    )
    expect(await fetchCurrencies()).toEqual([
      { code: 'NGN', name: 'Nigerian Naira' },
      { code: 'USD', name: 'US Dollar' },
    ])
  })
  it('accepts a valid latest rate', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rate/USD/NGN`, () =>
        HttpResponse.json(row),
      ),
    )
    expect(await fetchLatestRate('USD', 'NGN')).toEqual(row)
  })
  it('rejects wrong pair data instead of showing it under the selected pair', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rate/USD/NGN`, () =>
        HttpResponse.json({ ...row, quote: 'EUR' }),
      ),
    )
    await expect(fetchLatestRate('USD', 'NGN')).rejects.toMatchObject({
      kind: 'invalid',
    })
  })
  it.each([0, -1, '1.2', Infinity, NaN])('rejects invalid rate %s', (rate) => {
    expect(rateSchema.safeParse({ ...row, rate }).success).toBe(false)
  })
  it('rejects impossible dates', () =>
    expect(rateSchema.safeParse({ ...row, date: '2026-02-30' }).success).toBe(
      false,
    ))
  it('keeps missing rates, sorts history, deduplicates and excludes dates outside the range', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, ({ request }) => {
        expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({
          base: 'USD',
          quotes: 'NGN',
          ...range,
        })
        return HttpResponse.json([
          row,
          { ...row, date: '2026-09-25', rate: null },
          { ...row, date: '2026-09-24', rate: 1290 },
          row,
          { ...row, date: '2026-09-23' },
        ])
      }),
    )
    expect(await fetchHistoricalRates('USD', 'NGN', range)).toEqual([
      { date: '2026-09-24', rate: 1290 },
      { date: '2026-09-25', rate: null },
      { date: '2026-09-30', rate: 1300 },
    ])
  })
  it('rejects conflicting dates', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, () =>
        HttpResponse.json([row, { ...row, rate: 1400 }]),
      ),
    )
    await expect(
      fetchHistoricalRates('USD', 'NGN', range),
    ).rejects.toMatchObject({ kind: 'invalid' })
  })
  it('handles an empty historical response', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, () => HttpResponse.json([])),
    )
    expect(await fetchHistoricalRates('USD', 'NGN', range)).toEqual([])
  })
  it('rejects malformed metadata', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () =>
        HttpResponse.json({ USD: 'Dollar' }),
      ),
    )
    await expect(fetchCurrencies()).rejects.toMatchObject({ kind: 'invalid' })
  })
  it.each([400, 404, 422, 429, 500])(
    'handles HTTP %s safely',
    async (status) => {
      server.use(
        http.get(`${CURRENCY_ENDPOINT}/rate/USD/NGN`, () =>
          HttpResponse.json({ message: 'raw provider details' }, { status }),
        ),
      )
      await expect(fetchLatestRate('USD', 'NGN')).rejects.toMatchObject({
        kind: 'http',
        status,
      })
    },
  )
  it('handles network errors', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () => HttpResponse.error()),
    )
    await expect(fetchCurrencies()).rejects.toMatchObject({ kind: 'network' })
  })
  it('passes cancellation to fetch', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(fetchCurrencies(controller.signal)).rejects.toBeDefined()
  })
  it('bounds retry to transient errors only', () => {
    expect(retryTransientError(0, new ApiError('http', '', 503))).toBe(true)
    expect(retryTransientError(2, new ApiError('network', ''))).toBe(false)
    expect(retryTransientError(0, new ApiError('http', '', 429))).toBe(false)
    expect(retryTransientError(0, new ApiError('invalid', ''))).toBe(false)
  })
})

describe('currency calculations and selection', () => {
  it.each([
    ['7D', '2026-03-31', '2026-03-25'],
    ['1M', '2026-03-31', '2026-02-28'],
    ['3M', '2026-01-31', '2025-10-31'],
    ['1Y', '2024-02-29', '2023-02-28'],
  ] as const)('calculates inclusive %s boundaries', (period, date, from) => {
    expect(getCurrencyDateRange(period, new Date(`${date}T23:59:00Z`))).toEqual(
      { from, to: date },
    )
  })
  it('computes change/high/low using actual ordered observations', () => {
    expect(
      calculateCurrencyMetrics([
        { date: '2026-09-30', rate: 120 },
        { date: '2026-09-24', rate: 100 },
        { date: '2026-09-25', rate: null },
      ]),
    ).toMatchObject({
      count: 2,
      change: 20,
      percentage: 20,
      high: 120,
      low: 100,
    })
  })
  it('computes a decrease', () =>
    expect(
      calculateCurrencyMetrics([
        { date: '2026-09-24', rate: 100 },
        { date: '2026-09-30', rate: 80 },
      ]),
    ).toMatchObject({ change: -20, percentage: -20 }))
  it.each([
    { points: [] },
    { points: [{ date: '2026-09-30', rate: 1 }] },
    {
      points: [
        { date: '2026-09-24', rate: 0 },
        { date: '2026-09-30', rate: 1 },
      ],
    },
  ])('does not invent change from insufficient data', ({ points }) =>
    expect(calculateCurrencyMetrics(points).percentage).toBeNull(),
  )
  it.each([
    '-1',
    '1e6',
    'NaN',
    'Infinity',
    '1,000',
    '1000000000001',
    '1.1234567',
  ])('rejects invalid amount %s', (value) =>
    expect(parseCurrencyAmount(value).error).not.toBeNull(),
  )
  it('handles empty, zero, decimals and large amounts', () => {
    expect(parseCurrencyAmount('')).toEqual({ value: null, error: null })
    expect(parseCurrencyAmount('0').value).toBe(0)
    expect(parseCurrencyAmount('123.45').value).toBe(123.45)
    expect(parseCurrencyAmount('1000000000000').error).toBeNull()
    expect(convertCurrency(0, 1300)).toBe(0)
    expect(convertCurrency(2.5, 1300)).toBe(3250)
    expect(convertCurrency(1e12, 1e12)).toBeNull()
  })
  it('formats currency-specific fraction digits and small rates', () => {
    expect(formatMoney(123.45, 'JPY')).toBe('JPY\u00a0123')
    expect(formatMoney(123.45, 'USD')).toBe('USD\u00a0123.45')
    expect(formatRate(0.0000002)).not.toBe('0')
  })
  it('defaults to USD/NGN, falls back and validates stored choices', () => {
    const list = ['USD', 'NGN', 'EUR'].map((code) => ({ code, name: code }))
    expect(resolveCurrencySelection(null, list)).toEqual({
      base: 'USD',
      quote: 'NGN',
      period: '1M',
    })
    expect(
      resolveCurrencySelection(
        null,
        list.filter((c) => c.code !== 'NGN'),
      )?.quote,
    ).toBe('EUR')
    expect(
      resolveCurrencySelection(
        { base: 'XXX', quote: 'YYY', period: '1Y' },
        list,
      ),
    ).toEqual({ base: 'USD', quote: 'NGN', period: '1Y' })
    expect(
      selectionSchema.safeParse({ base: 'USD', quote: 'NGN', period: 'bad' })
        .success,
    ).toBe(false)
    expect(resolveCurrencySelection(null, [])).toBeNull()
  })
  it('isolates pair and historical range caches', () => {
    expect(currencyKeys.latest('USD', 'NGN')).not.toEqual(
      currencyKeys.latest('NGN', 'USD'),
    )
    expect(currencyKeys.history('USD', 'NGN', range)).not.toEqual(
      currencyKeys.history('USD', 'NGN', { ...range, from: '2026-09-01' }),
    )
  })
})
