import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../../test/server'
import DashboardOverview from '../components/DashboardOverview'
import CurrencyPage from '../../currencies/components/CurrencyPage'
import { forecastFixture } from '../../weather/__tests__/fixtures'
import { FORECAST_ENDPOINT } from '../../weather/api/weather.api'
import { CURRENCY_ENDPOINT } from '../../currencies/api/currencies.api'
import { ECONOMY_ENDPOINT } from '../../economy/api/economy.api'
import {
  countriesFixture,
  observationFixture,
  pageFixture,
} from '../../economy/__tests__/fixtures'
import {
  assetFixture,
  globalFixture,
  cryptoError,
} from '../../crypto/__tests__/fixtures'
import { cryptoKeys } from '../../crypto/api/crypto.keys'
import { normalizeAsset } from '../../crypto/utils/crypto'
import { CRYPTO_STORAGE_KEY } from '../../crypto/hooks/useCryptoPreferences'
import { CURRENCY_STORAGE_KEY } from '../../currencies/hooks/useCurrencySelection'
import { ECONOMY_STORAGE_KEY } from '../../economy/hooks/useEconomySelection'
import { DEFAULT_LOCATION } from '../../weather/hooks/useWeatherLocation'

const paths = {
  Weather: FORECAST_ENDPOINT,
  Currencies: `${CURRENCY_ENDPOINT}/currencies`,
  Economy: `${ECONOMY_ENDPOINT}/country`,
  Crypto: '*/api/crypto/*',
}
let requests: string[]
const row = (
  base = 'USD',
  quote = 'NGN',
  date = '2026-09-30',
  rate = 1300,
) => ({ date, base, quote, rate })
beforeEach(() => {
  requests = []
  sessionStorage.setItem(
    'insightsphere.weather.location',
    JSON.stringify(DEFAULT_LOCATION),
  )
  server.use(
    http.get(FORECAST_ENDPOINT, ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json(forecastFixture())
    }),
    http.get(`${CURRENCY_ENDPOINT}/currencies`, ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json([
        { iso_code: 'USD', name: 'US Dollar' },
        { iso_code: 'NGN', name: 'Naira' },
        { iso_code: 'EUR', name: 'Euro' },
      ])
    }),
    http.get(
      `${CURRENCY_ENDPOINT}/rate/:base/:quote`,
      ({ request, params }) => {
        requests.push(request.url)
        return HttpResponse.json(row(String(params.base), String(params.quote)))
      },
    ),
    http.get(`${CURRENCY_ENDPOINT}/rates`, ({ request }) => {
      requests.push(request.url)
      const p = new URL(request.url).searchParams
      return HttpResponse.json([
        row(p.get('base')!, p.get('quotes')!, p.get('from')!, 1200),
        row(p.get('base')!, p.get('quotes')!, p.get('to')!, 1300),
      ])
    }),
    http.get(`${ECONOMY_ENDPOINT}/country`, ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json(pageFixture(countriesFixture))
    }),
    http.get(
      `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
      ({ request, params }) => {
        requests.push(request.url)
        return HttpResponse.json(
          pageFixture(
            [
              observationFixture(
                2023,
                300e9,
                String(params.country),
                String(params.indicator),
              ),
              observationFixture(
                2024,
                350e9,
                String(params.country),
                String(params.indicator),
              ),
            ],
            { lastupdated: '2026-09-20' },
          ),
        )
      },
    ),
    http.get('*/api/crypto/global', ({ request }) => {
      requests.push(request.url)
      return HttpResponse.json(globalFixture)
    }),
    http.get('*/api/crypto/coins/:id', ({ request, params }) => {
      requests.push(request.url)
      return HttpResponse.json([assetFixture(String(params.id))])
    }),
  )
})
function mount(
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, retryDelay: 0, gcTime: Infinity },
    },
  }),
) {
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route
              path="/currencies"
              element={
                <>
                  <Link to="/">Back to overview</Link>
                  <CurrencyPage />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
}
const card = (name: string) => within(screen.getByRole('region', { name }))
async function loaded() {
  await screen.findByText('$67,450.23')
  await screen.findByText('1,300', { selector: 'dd' })
  await screen.findByText('$350B', { selector: 'dd' })
  await waitFor(() =>
    expect(
      screen.queryByText('Loading weather summary…'),
    ).not.toBeInTheDocument(),
  )
}
function fail(name: keyof typeof paths, status = 400) {
  server.use(http.get(paths[name], () => HttpResponse.json({}, { status })))
}

describe('Unified analytics dashboard', () => {
  it('navigates into the currency module and back using the shared fresh cache', async () => {
    const user = userEvent.setup()
    mount()
    await loaded()
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Refresh currencies summary' }),
      ).toBeEnabled(),
    )
    const count = requests.length
    screen.getByRole('link', { name: 'Explore currencies' }).focus()
    await user.keyboard('{Enter}')
    expect(
      await screen.findByRole('heading', { name: 'Currency Analytics' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Back to overview' }))
    await loaded()
    expect(requests).toHaveLength(count)
  })
  it('keeps two healthy summaries usable when two providers fail', async () => {
    fail('Weather')
    fail('Crypto')
    mount()
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(2))
    await card('Currencies').findByText('1,300', { selector: 'dd' })
    await card('Economy').findByText('$350B', { selector: 'dd' })
  })
  it('keeps the latest currency rate when its history fails', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    )
    mount()
    await card('Currencies').findByRole('alert')
    expect(
      card('Currencies').getByText('1,300', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(
      card('Currencies').getByText(/Not enough observations/),
    ).toBeInTheDocument()
  })
  it('keeps partial weather and identifies missing current measurements', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({ ...forecastFixture(), current: undefined }),
      ),
    )
    mount()
    await card('Weather').findByText('Current observation time unavailable.')
    expect(
      card('Weather').getByText('Unavailable', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(
      card('Weather').getByText('Some weather measurements are unavailable.'),
    ).toBeInTheDocument()
  })
  it('handles an empty currency directory without issuing dependent rate requests', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () => HttpResponse.json([])),
    )
    mount()
    await card('Currencies').findByText('No supported currencies available.')
    expect(requests.some((url) => url.includes('/rate'))).toBe(false)
  })
  it('revalidates unsupported saved currencies and countries against provider directories', async () => {
    sessionStorage.setItem(
      CURRENCY_STORAGE_KEY,
      JSON.stringify({ base: 'ZZZ', quote: 'YYY', period: '7D' }),
    )
    sessionStorage.setItem(
      ECONOMY_STORAGE_KEY,
      JSON.stringify({
        country: 'ZZZ',
        indicator: 'NY.GDP.MKTP.CD',
        period: '10Y',
        comparisons: [],
      }),
    )
    mount()
    await loaded()
    expect(card('Currencies').getByText('USD → NGN · 7D')).toBeInTheDocument()
    expect(card('Economy').getByText(/Nigeria/)).toBeInTheDocument()
    expect(requests.some((url) => /ZZZ|YYY/.test(url))).toBe(false)
  })
  it('renders four summaries, bounded trends, source-specific dates and drill-down links', async () => {
    mount()
    await loaded()
    expect(card('Weather').getByText(/Abuja/)).toBeInTheDocument()
    expect(
      card('Weather').getByText(/Observation:.*Africa\/Lagos/),
    ).toBeInTheDocument()
    expect(
      card('Currencies').getByText(
        /Reference date:.*2026.*not a streaming quote/,
      ),
    ).toBeInTheDocument()
    expect(
      card('Economy').getByText(/Latest observation: 2024/),
    ).toBeInTheDocument()
    expect(card('Crypto').getByText(/Asset: Updated.*UTC/)).toBeInTheDocument()
    for (const [name, href] of [
      ['weather', '/weather'],
      ['currencies', '/currencies'],
      ['economy', '/economy'],
      ['crypto', '/crypto/bitcoin'],
    ])
      expect(
        screen.getByRole('link', { name: `Explore ${name}` }),
      ).toHaveAttribute('href', href)
    expect(requests).toHaveLength(8)
    expect(
      requests.some((url) =>
        /api\/crypto\/(markets|.*history)|api.coingecko.com|api_key/i.test(url),
      ),
    ).toBe(false)
    expect(screen.getAllByText('View trend values')).toHaveLength(3)
  })
  it.each(['Weather', 'Currencies', 'Economy', 'Crypto'] as const)(
    'isolates %s loading',
    async (name) => {
      server.use(
        http.get(paths[name], async () => {
          await delay(150)
          return HttpResponse.json({}, { status: 400 })
        }),
      )
      mount()
      expect(card(name).getByRole('status')).toHaveTextContent(
        `Loading ${name.toLowerCase()} summary`,
      )
      await card(name).findByRole('alert')
      expect(screen.getAllByRole('region')).toHaveLength(4)
    },
  )
  it.each(['Weather', 'Currencies', 'Economy', 'Crypto'] as const)(
    'isolates %s failure and preserves the other domains',
    async (name) => {
      fail(name)
      mount()
      await card(name).findByRole('alert')
      if (name !== 'Weather') await card('Weather').findByText(/Observation:/)
      if (name !== 'Currencies')
        await card('Currencies').findByText('1,300', { selector: 'dd' })
      if (name !== 'Economy')
        await card('Economy').findByText('$350B', { selector: 'dd' })
      if (name !== 'Crypto') await card('Crypto').findByText('$67,450.23')
      expect(card(name).getByRole('button', { name: /Retry/ })).toBeEnabled()
    },
  )
  it('keeps weather, currency and crypto visible when the economic series returns HTTP 500', async () => {
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () => HttpResponse.json({}, { status: 500 }),
      ),
    )
    mount()
    await card('Economy').findByRole('alert')
    expect(card('Weather').getByText(/Observation:/)).toBeInTheDocument()
    expect(
      card('Currencies').getByText('1,300', { selector: 'dd' }),
    ).toBeInTheDocument()
    expect(card('Crypto').getByText('$67,450.23')).toBeInTheDocument()
  })
  it('handles simultaneous and total failures without losing navigation', async () => {
    fail('Weather')
    fail('Economy')
    fail('Currencies')
    fail('Crypto')
    mount()
    await waitFor(() => expect(screen.getAllByRole('alert')).toHaveLength(4))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your analytics overview.',
    )
    expect(screen.getAllByRole('link', { name: /Explore/ })).toHaveLength(4)
  })
  it('retains cached values after failed refresh and recovers with keyboard retry', async () => {
    const user = userEvent.setup()
    mount()
    await loaded()
    server.use(
      http.get(FORECAST_ENDPOINT, () => HttpResponse.json({}, { status: 400 })),
    )
    card('Weather').getByRole('button').focus()
    await user.keyboard('{Enter}')
    expect(await card('Weather').findByRole('alert')).toHaveTextContent(
      'retained and may be stale',
    )
    expect(card('Weather').getByText(/Observation:/)).toBeInTheDocument()
    server.use(
      http.get(FORECAST_ENDPOINT, () => HttpResponse.json(forecastFixture())),
    )
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(card('Weather').queryByRole('alert')).not.toBeInTheDocument(),
    )
  })
  it('uses saved selections without fetching economic comparisons or crypto histories', async () => {
    sessionStorage.setItem(
      CURRENCY_STORAGE_KEY,
      JSON.stringify({ base: 'EUR', quote: 'USD', period: '7D' }),
    )
    sessionStorage.setItem(
      ECONOMY_STORAGE_KEY,
      JSON.stringify({
        country: 'GHA',
        indicator: 'NY.GDP.MKTP.CD',
        period: '20Y',
        comparisons: ['NGA', 'ZAF'],
      }),
    )
    sessionStorage.setItem(
      CRYPTO_STORAGE_KEY,
      JSON.stringify({ coinId: 'ethereum', period: '1Y' }),
    )
    sessionStorage.setItem(
      'insightsphere.weather.location',
      JSON.stringify({
        ...DEFAULT_LOCATION,
        name: 'Lagos',
        latitude: 6.45,
        longitude: 3.4,
      }),
    )
    mount()
    await loaded()
    expect(card('Currencies').getByText('EUR → USD · 7D')).toBeInTheDocument()
    expect(card('Economy').getByText(/Ghana/)).toBeInTheDocument()
    expect(card('Crypto').getByText(/Ethereum/)).toBeInTheDocument()
    expect(card('Weather').getByText(/Lagos, Nigeria/)).toBeInTheDocument()
    expect(requests.filter((url) => url.includes('/indicator/'))).toHaveLength(
      1,
    )
    expect(requests.find((url) => url.includes('/indicator/'))).toContain(
      '/country/GHA/',
    )
    expect(requests.some((url) => url.includes('/history'))).toBe(false)
  })
  it('falls back safely from corrupted preferences', async () => {
    for (const key of [
      CURRENCY_STORAGE_KEY,
      ECONOMY_STORAGE_KEY,
      CRYPTO_STORAGE_KEY,
      'insightsphere.weather.location',
    ])
      sessionStorage.setItem(key, '{broken')
    mount()
    await loaded()
    expect(card('Currencies').getByText('USD → NGN · 1M')).toBeInTheDocument()
    expect(card('Economy').getByText(/Nigeria/)).toBeInTheDocument()
    expect(card('Crypto').getByText(/Bitcoin/)).toBeInTheDocument()
  })
  it('reuses the same fresh query cache on return navigation', async () => {
    const first = mount()
    await loaded()
    const count = requests.length
    first.unmount()
    mount(first.client)
    await loaded()
    expect(requests).toHaveLength(count)
  })
  it('reuses a fresh selected quote from the detail market cache', async () => {
    const client = new QueryClient()
    client.setQueryData(cryptoKeys.markets(), [normalizeAsset(assetFixture())])
    mount(client)
    await loaded()
    expect(
      requests.some((url) => url.includes('/api/crypto/coins/bitcoin')),
    ).toBe(false)
  })
  it('handles empty economic observations and missing crypto metrics without inventing zeroes', async () => {
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () => HttpResponse.json(pageFixture([observationFixture(2024, null)])),
      ),
      http.get('*/api/crypto/coins/:id', () =>
        HttpResponse.json([
          {
            ...assetFixture(),
            current_price: null,
            price_change_percentage_24h: null,
          },
        ]),
      ),
    )
    mount()
    await card('Economy').findByText(
      'No observations available for this selection.',
    )
    await card('Crypto').findByText('24-hour change: Unavailable')
    expect(card('Economy').getByText('Unavailable')).toBeInTheDocument()
    expect(card('Crypto').getByText('Unavailable')).toBeInTheDocument()
  })
  it('keeps global crypto metrics when the selected quote is unavailable', async () => {
    server.use(
      http.get('*/api/crypto/coins/:id', () =>
        HttpResponse.json([], { status: 200 }),
      ),
    )
    mount()
    await card('Crypto').findByRole('alert')
    expect(card('Crypto').getByText('$2.5T')).toBeInTheDocument()
  })
  it('isolates a missing server API key', async () => {
    server.use(
      http.get('*/api/crypto/*', () =>
        HttpResponse.json(cryptoError('NOT_CONFIGURED'), { status: 503 }),
      ),
    )
    mount()
    await card('Crypto').findByRole('alert')
    await card('Economy').findByText('$350B', { selector: 'dd' })
    expect(
      card('Currencies').getByText('1,300', { selector: 'dd' }),
    ).toBeInTheDocument()
  })
  it('uses identity rates without unnecessary reference-rate requests', async () => {
    sessionStorage.setItem(
      CURRENCY_STORAGE_KEY,
      JSON.stringify({ base: 'USD', quote: 'USD', period: '1M' }),
    )
    mount()
    await card('Currencies').findByText(/Same-currency identity rate/)
    expect(card('Currencies').getByText('1')).toBeInTheDocument()
    expect(
      requests.some((url) => /\/rate[s/]?/.test(new URL(url).pathname)),
    ).toBe(false)
  })
})
