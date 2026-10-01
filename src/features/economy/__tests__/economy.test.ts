import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import {
  ECONOMY_ENDPOINT,
  fetchCountries,
  fetchEconomicSeries,
  fetchIndicatorMetadata,
} from '../api/economy.api'
import { economyKeys } from '../api/economy.keys'
import {
  countrySchema,
  economySelectionSchema,
  observationSchema,
} from '../schemas/economy.schema'
import { resolveEconomySelection } from '../hooks/useEconomySelection'
import { mapCountries, mapEconomicSeries } from '../utils/mapEconomicResponse'
import {
  calculateEconomicMetrics,
  economicChartPoints,
  latestComparableYear,
} from '../utils/economicCalculations'
import {
  formatEconomicChange,
  formatEconomicValue,
} from '../utils/economicFormatters'
import {
  ECONOMIC_INDICATORS,
  DEFAULT_INDICATOR,
} from '../utils/economicIndicators'
import { getEconomicRange } from '../utils/economicPeriods'
import {
  countriesFixture,
  indicatorFixture,
  observationFixture,
  pageFixture,
} from './fixtures'

const range = { from: 2020, to: 2026 }
const seriesUrl = `${ECONOMY_ENDPOINT}/country/NGA/indicator/${DEFAULT_INDICATOR.code}`
function normalized(
  rows = [observationFixture(2020, 100), observationFixture(2024, 125)],
  country = 'NGA',
) {
  return mapEconomicSeries(rows, country, DEFAULT_INDICATOR.code, range, null)
}

describe('World Bank contracts', () => {
  it('normalizes countries, removes aggregates and sorts names', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, () =>
        HttpResponse.json(pageFixture(countriesFixture)),
      ),
    )
    expect((await fetchCountries()).map((country) => country.name)).toEqual([
      'Ghana',
      'Nigeria',
      'South Africa',
    ])
    expect(
      (await fetchCountries()).find((country) => country.id === 'NGA'),
    ).toMatchObject({ iso2Code: 'NG', region: 'Sub-Saharan Africa' })
  })
  it('follows every metadata page and accepts numeric-string metadata', async () => {
    const pages: string[] = []
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, ({ request }) => {
        const page = new URL(request.url).searchParams.get('page') ?? ''
        pages.push(page)
        return HttpResponse.json(
          pageFixture([countriesFixture[Number(page) - 1]], {
            page,
            pages: '2',
            total: '2',
          }),
        )
      }),
    )
    expect(await fetchCountries()).toHaveLength(2)
    expect(pages).toEqual(['1', '2'])
  })
  it('follows series pagination and validates requested date/source parameters', async () => {
    server.use(
      http.get(seriesUrl, ({ request }) => {
        const query = new URL(request.url).searchParams
        expect(query.get('date')).toBe('2020:2026')
        expect(query.get('source')).toBe('2')
        expect(query.get('format')).toBe('json')
        const page = Number(query.get('page'))
        return HttpResponse.json(
          pageFixture(
            [
              observationFixture(
                page === 1 ? 2024 : 2020,
                page === 1 ? 125 : 100,
              ),
            ],
            { page, pages: 2, total: 2, lastupdated: '2026-07-13' },
          ),
        )
      }),
    )
    expect(
      await fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).toMatchObject({
      observations: [
        { year: 2020, value: 100 },
        { year: 2024, value: 125 },
      ],
      latest: { year: 2024, value: 125 },
      updated: '2026-07-13',
    })
  })
  it.each([
    { page: 2, pages: 1, total: 1 },
    { page: 1, pages: 21, total: 1 },
    { page: 1, pages: 1, total: 5001 },
    { page: 1, pages: 1, total: 2 },
  ])('rejects incomplete or unsafe pagination %j', async (meta) => {
    server.use(
      http.get(seriesUrl, () =>
        HttpResponse.json(pageFixture([observationFixture(2024, 1)], meta)),
      ),
    )
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toMatchObject({ kind: 'invalid' })
  })
  it('rejects changed totals while paginating', async () => {
    server.use(
      http.get(seriesUrl, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'))
        return HttpResponse.json(
          pageFixture([observationFixture(2020 + page, 1)], {
            page,
            pages: 2,
            total: page === 1 ? 2 : 3,
          }),
        )
      }),
    )
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toMatchObject({ kind: 'invalid' })
  })
  it('detects HTTP 200 provider error payloads', async () => {
    server.use(
      http.get(seriesUrl, () =>
        HttpResponse.json([
          {
            message: [{ id: '120', key: 'Invalid value', value: 'Bad input' }],
          },
        ]),
      ),
    )
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toThrow('World Bank could not process')
  })
  it.each([null, []])('accepts empty rows %j', async (rows) => {
    server.use(http.get(seriesUrl, () => HttpResponse.json(pageFixture(rows))))
    expect(
      (await fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range)).latest,
    ).toBeNull()
  })
  it('accepts metadata-only zero-total responses', async () => {
    server.use(
      http.get(seriesUrl, () =>
        HttpResponse.json([{ page: 1, pages: 0, total: 0 }]),
      ),
    )
    expect(
      (await fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range))
        .observations,
    ).toEqual([])
  })
  it('rejects missing rows with nonzero total', async () => {
    server.use(
      http.get(seriesUrl, () =>
        HttpResponse.json(pageFixture(null, { total: 1 })),
      ),
    )
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toMatchObject({ kind: 'invalid' })
  })
  it('fetches source-specific indicator metadata', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/indicator/${DEFAULT_INDICATOR.code}`, () =>
        HttpResponse.json(indicatorFixture()),
      ),
    )
    expect(await fetchIndicatorMetadata(DEFAULT_INDICATOR.code)).toMatchObject({
      code: DEFAULT_INDICATOR.code,
      description: 'A provider definition for this indicator.',
    })
  })
  it.each([400, 404, 429, 503])('handles HTTP %s', async (status) => {
    server.use(http.get(seriesUrl, () => HttpResponse.json({}, { status })))
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toMatchObject({ kind: 'http', status })
  })
  it('handles network failure', async () => {
    server.use(http.get(seriesUrl, () => HttpResponse.error()))
    await expect(
      fetchEconomicSeries('NGA', DEFAULT_INDICATOR.code, range),
    ).rejects.toMatchObject({ kind: 'network' })
  })
  it('honors request cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      fetchEconomicSeries(
        'NGA',
        DEFAULT_INDICATOR.code,
        range,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('rejects malformed annual observations and metadata', () => {
    expect(
      observationSchema.safeParse({
        ...observationFixture(2024, 1),
        date: '2024Q1',
      }).success,
    ).toBe(false)
    expect(
      observationSchema.safeParse({
        ...observationFixture(2024, 1),
        value: '1',
      }).success,
    ).toBe(false)
    expect(countrySchema.safeParse({ id: 'NGA' }).success).toBe(false)
    expect(
      observationSchema.safeParse(observationFixture(2024, Infinity)).success,
    ).toBe(false)
  })
})

describe('economic data integrity', () => {
  it('sorts years, retains nulls, and finds the latest non-null value', () => {
    expect(
      normalized([
        observationFixture(2026, null),
        observationFixture(2024, 125),
        observationFixture(2020, 100),
      ]),
    ).toMatchObject({
      observations: [
        { year: 2020, value: 100 },
        { year: 2024, value: 125 },
        { year: 2026, value: null },
      ],
      latest: { year: 2024, value: 125 },
    })
  })
  it('filters out-of-range rows if the provider ignores the date filter', () =>
    expect(
      normalized([
        observationFixture(2019, 500),
        observationFixture(2024, 100),
        observationFixture(2027, 600),
      ]).observations,
    ).toEqual([{ year: 2024, value: 100 }]))
  it('rejects mixed countries, indicators and conflicting duplicate years', () => {
    expect(() => normalized([observationFixture(2024, 100, 'GHA')])).toThrow()
    expect(() =>
      normalized([observationFixture(2024, 100, 'NGA', 'SP.POP.TOTL')]),
    ).toThrow()
    expect(() =>
      normalized([
        observationFixture(2024, 100),
        observationFixture(2024, 101),
      ]),
    ).toThrow()
  })
  it('creates only null chart gap markers and preserves real zeroes', () => {
    expect(
      economicChartPoints(
        [
          { year: 2020, value: 0 },
          { year: 2022, value: 10 },
        ],
        { from: 2020, to: 2022 },
      ),
    ).toEqual([
      { year: 2020, value: 0 },
      { year: 2021, value: null },
      { year: 2022, value: 10 },
    ])
  })
  it.each([
    ['10Y', 2017],
    ['20Y', 2007],
    ['30Y', 1997],
    ['MAX', 1960],
  ] as const)('calculates the %s inclusive annual range', (period, from) =>
    expect(getEconomicRange(period, new Date('2026-09-30T12:00:00Z'))).toEqual({
      from,
      to: 2026,
    }),
  )
  it('calculates relative GDP change and extrema', () =>
    expect(
      calculateEconomicMetrics(normalized().observations, DEFAULT_INDICATOR),
    ).toMatchObject({ change: 25, difference: 25, high: 125, low: 100 }))
  it.each(
    ECONOMIC_INDICATORS.filter((indicator) => indicator.change === 'points'),
  )('uses percentage points for $name', (indicator) =>
    expect(
      calculateEconomicMetrics(
        [
          { year: 2020, value: 10 },
          { year: 2024, value: 12 },
        ],
        indicator,
      ).change,
    ).toBe(2),
  )
  it('uses absolute years for life expectancy', () =>
    expect(
      calculateEconomicMetrics(
        [
          { year: 2020, value: 60 },
          { year: 2024, value: 62 },
        ],
        ECONOMIC_INDICATORS[7],
      ).change,
    ).toBe(2))
  it('handles empty, single, zero-denominator and negative rate observations', () => {
    expect(calculateEconomicMetrics([], DEFAULT_INDICATOR).high).toBeNull()
    expect(
      calculateEconomicMetrics([{ year: 2020, value: 100 }], DEFAULT_INDICATOR)
        .change,
    ).toBeNull()
    expect(
      calculateEconomicMetrics(
        [
          { year: 2020, value: 0 },
          { year: 2021, value: 100 },
        ],
        DEFAULT_INDICATOR,
      ).change,
    ).toBeNull()
    expect(
      calculateEconomicMetrics(
        [
          { year: 2020, value: -2 },
          { year: 2021, value: 1 },
        ],
        ECONOMIC_INDICATORS[1],
      ).change,
    ).toBe(3)
  })
  it.each([
    { index: 0, value: 363_800_000_000, formatted: '$363.8B' },
    { index: 2, value: 2340, formatted: '$2.34K' },
    { index: 3, value: 232_700_000, formatted: '232.7M' },
    { index: 1, value: 3.4, formatted: '3.4%' },
    { index: 7, value: 62.3, formatted: '62.3 years' },
  ])('formats $formatted appropriately', ({ index, value, formatted }) =>
    expect(formatEconomicValue(value, ECONOMIC_INDICATORS[index])).toBe(
      formatted,
    ),
  )
  it('formats precision tables and change units without NaN', () => {
    expect(formatEconomicValue(2340, ECONOMIC_INDICATORS[2], false)).toBe(
      '$2,340.00',
    )
    expect(formatEconomicChange(1.1, ECONOMIC_INDICATORS[6])).toBe(
      '+1.1 percentage points',
    )
    expect(formatEconomicValue(null, DEFAULT_INDICATOR)).toBe('Unavailable')
    expect(formatEconomicChange(Infinity, DEFAULT_INDICATOR)).toBe(
      'Unavailable',
    )
  })
  it('finds the latest shared non-null year, not different latest years', () => {
    const first = normalized([
      observationFixture(2023, 100),
      observationFixture(2024, 125),
    ])
    const second = normalized(
      [
        observationFixture(2023, 80, 'GHA'),
        observationFixture(2024, null, 'GHA'),
      ],
      'GHA',
    )
    expect(latestComparableYear([first, second])).toBe(2023)
    expect(
      latestComparableYear([
        first,
        normalized([observationFixture(2022, 5, 'GHA')], 'GHA'),
      ]),
    ).toBeNull()
    expect(latestComparableYear([first])).toBeNull()
  })
  it('validates and reconciles persisted selections and comparison duplicates', () => {
    const countries = mapCountries(countriesFixture)
    expect(resolveEconomySelection(null, countries)?.country).toBe('NGA')
    expect(
      resolveEconomySelection(
        {
          country: 'XXX',
          indicator: DEFAULT_INDICATOR.code,
          period: 'MAX',
          comparisons: ['GHA', 'GHA'],
        },
        countries,
      ),
    ).toMatchObject({ country: 'NGA', comparisons: ['GHA'] })
    expect(resolveEconomySelection(null, [])).toBeNull()
    expect(
      economySelectionSchema.safeParse({
        country: 'NGA',
        indicator: 'invalid',
        period: '10Y',
        comparisons: [],
      }).success,
    ).toBe(false)
    expect(
      economySelectionSchema.safeParse({
        country: 'NGA',
        indicator: DEFAULT_INDICATOR.code,
        period: '7D',
        comparisons: [],
      }).success,
    ).toBe(false)
  })
  it('isolates country, indicator and range query caches', () => {
    const key = economyKeys.series('NGA', DEFAULT_INDICATOR.code, range)
    expect(key).not.toEqual(
      economyKeys.series('GHA', DEFAULT_INDICATOR.code, range),
    )
    expect(key).not.toEqual(economyKeys.series('NGA', 'SP.POP.TOTL', range))
    expect(key).not.toEqual(
      economyKeys.series('NGA', DEFAULT_INDICATOR.code, {
        from: 1960,
        to: 2026,
      }),
    )
  })
})
