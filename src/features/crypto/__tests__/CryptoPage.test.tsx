import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router'
import { delay, http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import CryptoPage from '../components/CryptoPage'
import { CRYPTO_STORAGE_KEY } from '../hooks/useCryptoPreferences'
import {
  assetFixture,
  cryptoError,
  globalFixture,
  historyFixture,
} from './fixtures'

let historyRequests: { id: string; period: string | null }[]
let detailRequests: string[]
beforeEach(() => {
  historyRequests = []
  detailRequests = []
  server.use(
    http.get('*/api/crypto/global', () => HttpResponse.json(globalFixture)),
    http.get('*/api/crypto/markets', () =>
      HttpResponse.json([assetFixture(), assetFixture('ethereum')]),
    ),
    http.get('*/api/crypto/coins/:id', ({ params }) => {
      detailRequests.push(String(params.id))
      return HttpResponse.json([])
    }),
    http.get('*/api/crypto/coins/:id/history', ({ params, request }) => {
      historyRequests.push({
        id: String(params.id),
        period: new URL(request.url).searchParams.get('period'),
      })
      return HttpResponse.json(historyFixture)
    }),
  )
})
function renderPage(path = '/crypto') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/crypto" element={<CryptoPage />} />
          <Route path="/crypto/:coinId" element={<CryptoPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
const loaded = (name = 'Bitcoin', period = '7D') =>
  screen.findByRole('img', { name: `${name} ${period} price trend` })

describe('Cryptocurrency Analytics', () => {
  it('shows loading states while the market is pending', async () => {
    server.use(
      http.get('*/api/crypto/markets', async () => {
        await delay(100)
        return HttpResponse.json([assetFixture()])
      }),
    )
    renderPage()
    expect(
      screen.getAllByRole('status', { name: 'Loading page' }).length,
    ).toBeGreaterThan(0)
    await loaded()
  })
  it('renders default Bitcoin, global metrics and ranked market table without redundant detail requests', async () => {
    renderPage()
    await loaded()
    expect(
      screen.getByRole('heading', { name: 'Cryptocurrency Analytics' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Global market cap')).toBeInTheDocument()
    expect(
      screen.getByRole('table', { name: /Cryptocurrency market rankings/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Market rank: 1/)).toBeInTheDocument()
    expect(screen.getAllByText(/Updated 30 Sept 2026/).length).toBeGreaterThan(
      0,
    )
    expect(detailRequests).toHaveLength(0)
  })
  it('selects assets with the keyboard and persists the selection', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await loaded()
    screen.getByRole('link', { name: 'Ethereum ETH' }).focus()
    await user.keyboard('{Enter}')
    await loaded('Ethereum')
    expect(historyRequests.at(-1)?.id).toBe('ethereum')
    expect(
      JSON.parse(sessionStorage.getItem(CRYPTO_STORAGE_KEY) ?? '{}').coinId,
    ).toBe('ethereum')
    view.unmount()
    renderPage()
    await loaded('Ethereum')
  })
  it.each(['24H', '30D', '1Y'])(
    'switches to %s with keyboard controls and persists the period',
    async (period) => {
      const user = userEvent.setup()
      const view = renderPage()
      await loaded()
      screen.getByRole('button', { name: period }).focus()
      await user.keyboard('{Enter}')
      await loaded('Bitcoin', period)
      expect(historyRequests.at(-1)?.period).toBe(period)
      expect(screen.getByRole('button', { name: period })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      view.unmount()
      renderPage()
      await loaded('Bitcoin', period)
    },
  )
  it('filters only the loaded table and shows a no-results message', async () => {
    renderPage()
    await loaded()
    await userEvent.type(
      screen.getByLabelText('Filter these assets'),
      'missing token',
    )
    expect(screen.getByText('No assets match this filter.')).toBeInTheDocument()
    expect(historyRequests).toHaveLength(1)
  })
  it('keeps partial null metrics usable', async () => {
    server.use(
      http.get('*/api/crypto/markets', () =>
        HttpResponse.json([
          {
            ...assetFixture(),
            current_price: null,
            market_cap_rank: null,
            high_24h: null,
            circulating_supply: null,
          },
        ]),
      ),
    )
    renderPage()
    await loaded()
    expect(
      screen.getByText(/Some provider metrics are unavailable/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Market rank: Unavailable/)).toBeInTheDocument()
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(
      /NaN|Infinity|undefined|Invalid Date/,
    )
  })
  it('isolates global failure from asset analysis', async () => {
    server.use(
      http.get('*/api/crypto/global', () =>
        HttpResponse.json(cryptoError('PROVIDER'), { status: 502 }),
      ),
    )
    renderPage()
    await loaded()
    expect(
      screen.getByRole('heading', { name: 'Global market could not refresh' }),
    ).toBeInTheDocument()
  })
  it('shows a rate-limit error without automatic retries and retains cached data', async () => {
    renderPage()
    await loaded()
    let calls = 0
    server.use(
      http.get('*/api/crypto/markets', () => {
        calls++
        return HttpResponse.json(cryptoError('RATE_LIMIT'), { status: 429 })
      }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh crypto' }),
    )
    await screen.findByText(/Previously retrieved market data is still shown/)
    expect(
      screen.getByRole('img', { name: 'Bitcoin 7D price trend' }),
    ).toBeInTheDocument()
    expect(calls).toBe(1)
  })
  it('retains cached history after a refresh error', async () => {
    renderPage()
    await loaded()
    server.use(
      http.get('*/api/crypto/coins/:id/history', () =>
        HttpResponse.json(cryptoError('PROVIDER'), { status: 502 }),
      ),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh crypto' }),
    )
    await screen.findByText(/Previously retrieved observations are still shown/)
    expect(
      screen.getByRole('img', { name: 'Bitcoin 7D price trend' }),
    ).toBeInTheDocument()
  })
  it('retries a history error successfully without blocking the market table', async () => {
    server.use(
      http.get('*/api/crypto/coins/:id/history', () =>
        HttpResponse.json(cryptoError('PROVIDER'), { status: 502 }),
      ),
    )
    renderPage()
    await screen.findByRole('heading', {
      name: 'Price history could not refresh',
    })
    expect(
      screen.getByRole('link', { name: 'Ethereum ETH' }),
    ).toBeInTheDocument()
    server.use(
      http.get('*/api/crypto/coins/:id/history', () =>
        HttpResponse.json(historyFixture),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await loaded()
  })
  it('shows an intentional empty history', async () => {
    server.use(
      http.get('*/api/crypto/coins/:id/history', () =>
        HttpResponse.json({ prices: [] }),
      ),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'No price observations' })
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('shows an empty market table without fabricating rankings', async () => {
    server.use(http.get('*/api/crypto/markets', () => HttpResponse.json([])))
    renderPage()
    await screen.findByText('No market assets are available.')
    await screen.findByRole('heading', { name: 'Asset could not refresh' })
  })
  it('shows missing configuration safely', async () => {
    server.use(
      http.get('*/api/crypto/*', () =>
        HttpResponse.json(cryptoError('NOT_CONFIGURED'), { status: 503 }),
      ),
    )
    renderPage()
    expect(
      (
        await screen.findAllByText(
          /Cryptocurrency data is not available in this workspace yet/,
        )
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.queryByText(/COINGECKO_API_KEY/)).not.toBeInTheDocument()
    expect(
      screen.queryByText('Do not display untrusted error text'),
    ).not.toBeInTheDocument()
  })
  it('rejects malformed route IDs without fetching their data', async () => {
    renderPage('/crypto/BAD-ID')
    await screen.findByRole('heading', { name: 'Invalid asset ID' })
    await screen.findByRole('link', { name: 'Ethereum ETH' })
    expect(detailRequests).toHaveLength(0)
    expect(historyRequests).toHaveLength(0)
  })
  it('handles unknown deep links without substituting Bitcoin', async () => {
    renderPage('/crypto/unknown-coin')
    await screen.findByRole('heading', { name: 'Asset could not refresh' })
    expect(detailRequests).toEqual(['unknown-coin'])
    expect(historyRequests).toHaveLength(0)
    expect(
      screen.queryByRole('heading', { name: /Bitcoin BTC/ }),
    ).not.toBeInTheDocument()
  })
  it('loads a valid deep link outside the market table', async () => {
    server.use(
      http.get('*/api/crypto/coins/other-asset', () =>
        HttpResponse.json([
          { ...assetFixture(), id: 'other-asset', name: 'Other asset' },
        ]),
      ),
    )
    renderPage('/crypto/other-asset')
    await loaded('Other asset')
  })
  it('exposes accessible historical values and null gaps in a table', async () => {
    renderPage()
    await loaded()
    await userEvent.click(screen.getByText('View price data table'))
    const table = screen.getByRole('table', {
      name: /Actual provider observations/,
    })
    expect(within(table).getByText('$100.00')).toBeVisible()
    expect(within(table).getByText('Unavailable')).toBeVisible()
  })
  it('recovers from corrupted stored preferences', async () => {
    sessionStorage.setItem(CRYPTO_STORAGE_KEY, '{broken')
    renderPage()
    await loaded()
  })
})
