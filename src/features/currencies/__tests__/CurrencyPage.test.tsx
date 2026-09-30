import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { CURRENCY_ENDPOINT } from '../api/currencies.api'
import { CURRENCY_STORAGE_KEY } from '../hooks/useCurrencySelection'
import CurrencyPage from '../components/CurrencyPage'

const metadata = ['USD', 'NGN', 'EUR', 'JPY'].map((iso_code) => ({
  iso_code,
  name: iso_code,
}))
let rateRequests: string[]
let historyRequests: string[]
beforeEach(() => {
  rateRequests = []
  historyRequests = []
  server.use(
    http.get(`${CURRENCY_ENDPOINT}/currencies`, () =>
      HttpResponse.json(metadata),
    ),
    http.get(`${CURRENCY_ENDPOINT}/rate/:base/:quote`, ({ params }) => {
      rateRequests.push(`${params.base}/${params.quote}`)
      return HttpResponse.json({
        base: params.base,
        quote: params.quote,
        date: new Date().toISOString().slice(0, 10),
        rate: 2,
      })
    }),
    http.get(`${CURRENCY_ENDPOINT}/rates`, ({ request }) => {
      const query = new URL(request.url).searchParams
      historyRequests.push(request.url)
      return HttpResponse.json([
        {
          base: query.get('base'),
          quote: query.get('quotes'),
          date: query.get('from'),
          rate: 1,
        },
        {
          base: query.get('base'),
          quote: query.get('quotes'),
          date: query.get('to'),
          rate: 2,
        },
      ])
    }),
  )
})
function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <CurrencyPage />
    </QueryClientProvider>,
  )
}
async function loaded() {
  await screen.findByText('1 USD = 2 NGN')
  await screen.findByRole('img', { name: 'USD to NGN exchange rate trend' })
}

describe('currency page behavior', () => {
  it('loads supported currencies, latest and history with accessible states', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, async () => {
        await delay(100)
        return HttpResponse.json(metadata)
      }),
    )
    renderPage()
    expect(
      screen.getByRole('status', { name: 'Loading currencies' }),
    ).toBeInTheDocument()
    await loaded()
    expect(screen.getByLabelText('Base currency')).toHaveValue('USD')
    expect(screen.getByLabelText('Quote currency')).toHaveValue('NGN')
    expect(screen.getByText('+100%')).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(
      /NaN|Infinity|undefined|Invalid Date/,
    )
  })
  it('converts decimal and zero locally, rejects invalid input, and preserves amount on swap', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    const amount = screen.getByLabelText('Amount in USD')
    await user.clear(amount)
    await user.type(amount, '2.5')
    expect(screen.getByText('NGN 5.00')).toBeInTheDocument()
    await user.clear(amount)
    await user.type(amount, '0')
    expect(screen.getByText('NGN 0.00')).toBeInTheDocument()
    await user.clear(amount)
    await user.type(amount, '1e4')
    expect(amount).toHaveAttribute('aria-invalid', 'true')
    await user.clear(amount)
    await user.type(amount, '3.25')
    expect(rateRequests).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Swap currencies' }))
    await screen.findByText('1 NGN = 2 USD')
    expect(screen.getByLabelText('Amount in NGN')).toHaveValue('3.25')
    expect(rateRequests).toContain('NGN/USD')
  })
  it('switches all periods, updates queries and persists selections on remount', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await loaded()
    for (const period of ['7D', '3M', '1Y']) {
      await user.click(screen.getByRole('button', { name: period }))
      await waitFor(() =>
        expect(screen.getByRole('button', { name: period })).toHaveAttribute(
          'aria-pressed',
          'true',
        ),
      )
    }
    await user.selectOptions(screen.getByLabelText('Quote currency'), 'EUR')
    await screen.findByText('1 USD = 2 EUR')
    expect(historyRequests.length).toBeGreaterThanOrEqual(4)
    view.unmount()
    renderPage()
    await screen.findByText('1 USD = 2 EUR')
    expect(screen.getByRole('button', { name: '1Y' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
  it('does not request rate/history for the same currency', async () => {
    sessionStorage.setItem(
      CURRENCY_STORAGE_KEY,
      JSON.stringify({ base: 'USD', quote: 'USD', period: '7D' }),
    )
    renderPage()
    await screen.findByText('1 USD = 1 USD')
    expect(
      screen.getByRole('heading', { name: 'No exchange-rate movement' }),
    ).toBeInTheDocument()
    expect(rateRequests).toHaveLength(0)
    expect(historyRequests).toHaveLength(0)
  })
  it('retries a metadata failure successfully', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () =>
        HttpResponse.json({}, { status: 422 }),
      ),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Currencies could not load' })
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () =>
        HttpResponse.json(metadata),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await loaded()
  })
  it('handles empty metadata without requesting a guessed pair', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/currencies`, () => HttpResponse.json([])),
    )
    renderPage()
    await screen.findByRole('heading', {
      name: 'No supported currencies available',
    })
    expect(rateRequests).toHaveLength(0)
  })
  it('retains rates and history after a failed refresh', async () => {
    renderPage()
    await loaded()
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rate/:base/:quote`, () =>
        HttpResponse.json({}, { status: 422 }),
      ),
      http.get(`${CURRENCY_ENDPOINT}/rates`, () =>
        HttpResponse.json({}, { status: 422 }),
      ),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh currencies' }),
    )
    await screen.findByRole('heading', { name: 'Latest rate refresh failed' })
    await screen.findByRole('heading', { name: 'History refresh failed' })
    expect(screen.getByText('1 USD = 2 NGN')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'USD to NGN exchange rate trend' }),
    ).toBeInTheDocument()
  })
  it('shows an empty history independently of a usable converter', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, () => HttpResponse.json([])),
    )
    renderPage()
    await screen.findByRole('heading', {
      name: 'No historical rates available',
    })
    await screen.findByText('NGN 2,000.00')
  })
  it('keeps history available when the latest request fails', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rate/:base/:quote`, () =>
        HttpResponse.json({}, { status: 404 }),
      ),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Latest rate could not load' })
    await screen.findByRole('img', { name: 'USD to NGN exchange rate trend' })
    expect(screen.getByText('Rate unavailable')).toBeInTheDocument()
  })
  it('recovers from malformed stored selections', async () => {
    sessionStorage.setItem(CURRENCY_STORAGE_KEY, '{bad')
    renderPage()
    await loaded()
  })
  it('retains missing observations and exposes the historical table', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rates`, ({ request }) => {
        const query = new URL(request.url).searchParams
        return HttpResponse.json([
          { base: 'USD', quote: 'NGN', date: query.get('from'), rate: null },
          { base: 'USD', quote: 'NGN', date: query.get('to'), rate: 2 },
        ])
      }),
    )
    renderPage()
    await loaded()
    expect(screen.getByText(/Some rates are missing/)).toBeInTheDocument()
    expect(screen.getByText(/Only one observation/)).toBeInTheDocument()
    await userEvent.click(screen.getByText('View historical data table'))
    expect(screen.getByRole('table')).toBeVisible()
    expect(
      screen.getByRole('columnheader', { name: 'Rate (NGN)' }),
    ).toBeInTheDocument()
  })
  it('shows rate and history loading separately after metadata loads', async () => {
    server.use(
      http.get(`${CURRENCY_ENDPOINT}/rate/:base/:quote`, async () => {
        await delay(150)
        return HttpResponse.json({
          base: 'USD',
          quote: 'NGN',
          date: new Date().toISOString().slice(0, 10),
          rate: 2,
        })
      }),
      http.get(`${CURRENCY_ENDPOINT}/rates`, async () => {
        await delay(150)
        return HttpResponse.json([])
      }),
    )
    renderPage()
    expect(
      await screen.findByRole('status', { name: 'Loading latest rate' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('status', { name: 'Loading historical rates' }),
    ).toBeInTheDocument()
    await screen.findByRole('heading', {
      name: 'No historical rates available',
    })
  })
  it('supports keyboard activation of period controls', async () => {
    renderPage()
    await loaded()
    const period = screen.getByRole('button', { name: '7D' })
    period.focus()
    await userEvent.keyboard('{Enter}')
    expect(period).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(historyRequests).toHaveLength(2))
  })
})
