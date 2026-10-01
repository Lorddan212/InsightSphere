import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { delay, http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { ECONOMY_ENDPOINT } from '../api/economy.api'
import { ECONOMY_STORAGE_KEY } from '../hooks/useEconomySelection'
import {
  DEFAULT_INDICATOR,
  ECONOMIC_INDICATORS,
} from '../utils/economicIndicators'
import EconomyPage from '../components/EconomyPage'
import {
  countriesFixture,
  indicatorFixture,
  observationFixture,
  pageFixture,
} from './fixtures'

const year = new Date().getUTCFullYear()
let requests: { country: string; indicator: string; date: string | null }[]
beforeEach(() => {
  requests = []
  server.use(
    http.get(`${ECONOMY_ENDPOINT}/country`, () =>
      HttpResponse.json(pageFixture(countriesFixture)),
    ),
    http.get(`${ECONOMY_ENDPOINT}/indicator/:indicator`, ({ params }) =>
      HttpResponse.json(indicatorFixture(String(params.indicator))),
    ),
    http.get(
      `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
      ({ params, request }) => {
        const country = String(params.country)
        const indicator = String(params.indicator)
        requests.push({
          country,
          indicator,
          date: new URL(request.url).searchParams.get('date'),
        })
        return HttpResponse.json(
          pageFixture(
            [
              observationFixture(year, null, country, indicator),
              observationFixture(
                year - 1,
                country === 'GHA' ? null : 125,
                country,
                indicator,
              ),
              observationFixture(year - 2, 100, country, indicator),
            ],
            { lastupdated: `${year}-01-01` },
          ),
        )
      },
    ),
  )
})
function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={client}>
      <EconomyPage />
    </QueryClientProvider>,
  )
}
async function loaded(country = 'Nigeria', indicator = 'GDP') {
  await screen.findByRole(
    'img',
    { name: `${country} ${indicator} historical trend` },
    { timeout: 3000 },
  )
}

describe('Economic Analytics page', () => {
  it('shows countries and series loading states before a successful Nigeria default', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, async () => {
        await delay(100)
        return HttpResponse.json(pageFixture(countriesFixture))
      }),
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        async () => {
          await delay(200)
          return HttpResponse.json(
            pageFixture([observationFixture(year - 1, 125)]),
          )
        },
      ),
    )
    renderPage()
    expect(
      screen.getByRole('status', { name: 'Loading countries' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('status', {
        name: 'Loading economic observations',
      }),
    ).toBeInTheDocument()
    await loaded()
    expect(screen.getByLabelText('Country or economy')).toHaveValue('NGA')
    expect(
      screen.getByText(`Data year: ${year - 1} · within selected range`),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'World' }),
    ).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(
      /NaN|Infinity|undefined|Invalid Date/,
    )
  })
  it('switches countries and indicators, querying only active selections', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.selectOptions(screen.getByLabelText('Country or economy'), 'ZAF')
    await loaded('South Africa')
    await user.selectOptions(
      screen.getByLabelText('Economic indicator'),
      'FP.CPI.TOTL.ZG',
    )
    await loaded('South Africa', 'Inflation')
    expect(screen.getByText('+25 percentage points')).toBeInTheDocument()
    expect(requests).toHaveLength(3)
    expect(requests.at(-1)).toMatchObject({
      country: 'ZAF',
      indicator: 'FP.CPI.TOTL.ZG',
    })
  })
  it.each(ECONOMIC_INDICATORS)(
    'loads the registered $name indicator',
    async (indicator) => {
      const user = userEvent.setup()
      renderPage()
      await loaded()
      await user.selectOptions(
        screen.getByLabelText('Economic indicator'),
        indicator.code,
      )
      await loaded('Nigeria', indicator.name)
      expect(requests.at(-1)?.indicator).toBe(indicator.code)
    },
  )
  it('switches annual periods with keyboard controls and persists on remount', async () => {
    const user = userEvent.setup()
    const view = renderPage()
    await loaded()
    for (const period of ['20Y', '30Y', 'MAX']) {
      const button = screen.getByRole('button', { name: period })
      button.focus()
      await user.keyboard('{Enter}')
      expect(button).toHaveAttribute('aria-pressed', 'true')
      await loaded()
    }
    await user.selectOptions(screen.getByLabelText('Country or economy'), 'ZAF')
    await loaded('South Africa')
    await user.selectOptions(
      screen.getByLabelText('Add comparison country'),
      'GHA',
    )
    await screen.findByText(
      `Latest common observation year: ${year - 2}. Every value below uses this year.`,
    )
    expect(requests.some((request) => request.date === `1960:${year}`)).toBe(
      true,
    )
    view.unmount()
    renderPage()
    await loaded('South Africa')
    expect(screen.getByRole('button', { name: 'MAX' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.getByRole('button', { name: 'Remove Ghana from comparison' }),
    ).toBeInTheDocument()
  })
  it('shows a common observation year and caps comparison at three countries', async () => {
    const user = userEvent.setup()
    renderPage()
    await loaded()
    await user.selectOptions(
      screen.getByLabelText('Add comparison country'),
      'GHA',
    )
    await screen.findByText(
      `Latest common observation year: ${year - 2}. Every value below uses this year.`,
    )
    await user.selectOptions(
      screen.getByLabelText('Add comparison country'),
      'ZAF',
    )
    await screen.findByText(
      `Latest common observation year: ${year - 2}. Every value below uses this year.`,
    )
    expect(screen.getByLabelText('Add comparison country')).toBeDisabled()
    const table = screen.getByRole('table', { name: 'GDP · Current US$' })
    expect(within(table).getAllByText(String(year - 2))).toHaveLength(3)
    expect(within(table).queryByText(String(year - 1))).not.toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Remove Ghana from comparison' }),
    )
    expect(screen.getByLabelText('Add comparison country')).toBeEnabled()
    expect(
      within(
        screen.getByRole('table', { name: 'GDP · Current US$' }),
      ).queryByText('Ghana'),
    ).not.toBeInTheDocument()
  })
  it('labels differing latest years when there is no common year', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country/GHA/indicator/:indicator`, () =>
        HttpResponse.json(
          pageFixture([observationFixture(year - 3, 50, 'GHA')]),
        ),
      ),
    )
    renderPage()
    await loaded()
    await userEvent.selectOptions(
      screen.getByLabelText('Add comparison country'),
      'GHA',
    )
    await screen.findByText(/No common observation year/)
    const table = screen.getByRole('table', { name: 'GDP · Current US$' })
    expect(within(table).getByText(String(year - 1))).toBeInTheDocument()
    expect(within(table).getByText(String(year - 3))).toBeInTheDocument()
  })
  it('contains comparison failure and can retry without removing primary analysis', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country/GHA/indicator/:indicator`, () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    )
    renderPage()
    await loaded()
    await userEvent.selectOptions(
      screen.getByLabelText('Add comparison country'),
      'GHA',
    )
    await screen.findByRole('heading', {
      name: 'Ghana comparison could not refresh',
    })
    expect(
      screen.getByRole('img', { name: 'Nigeria GDP historical trend' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Comparison is incomplete/)).toBeInTheDocument()
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country/GHA/indicator/:indicator`, () =>
        HttpResponse.json(
          pageFixture([observationFixture(year - 2, 50, 'GHA')]),
        ),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByText(
      `Latest common observation year: ${year - 2}. Every value below uses this year.`,
    )
  })
  it('retries country metadata errors', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'Countries could not load' })
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, () =>
        HttpResponse.json(pageFixture(countriesFixture)),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await loaded()
  })
  it('handles no selectable countries without guessing a series', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/country`, () =>
        HttpResponse.json(pageFixture([countriesFixture[3]])),
      ),
    )
    renderPage()
    await screen.findByRole('heading', { name: 'No countries available' })
    expect(requests).toHaveLength(0)
  })
  it('handles null-only observations without showing fabricated latest data', async () => {
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () => HttpResponse.json(pageFixture([observationFixture(year, null)])),
      ),
    )
    renderPage()
    await screen.findByRole('heading', {
      name: 'No observations in this range',
    })
    expect(screen.queryByText(`Data year: ${year}`)).not.toBeInTheDocument()
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThan(0)
  })
  it('retains cached primary observations when refresh fails', async () => {
    renderPage()
    await loaded()
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () => HttpResponse.json({}, { status: 400 }),
      ),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh economy' }),
    )
    await screen.findByRole('heading', { name: 'Economic refresh failed' })
    expect(
      screen.getByRole('img', { name: 'Nigeria GDP historical trend' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Previously retrieved observations are still shown/),
    ).toBeInTheDocument()
  })
  it('shows primary errors and retries successfully', async () => {
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () => HttpResponse.json([{ message: [{ id: '120' }] }]),
      ),
    )
    renderPage()
    await screen.findByRole('heading', {
      name: 'Economic observations could not load',
    })
    server.use(
      http.get(
        `${ECONOMY_ENDPOINT}/country/:country/indicator/:indicator`,
        () =>
          HttpResponse.json(pageFixture([observationFixture(year - 1, 125)])),
      ),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await loaded()
  })
  it('retains verified indicator context when provider metadata fails', async () => {
    server.use(
      http.get(`${ECONOMY_ENDPOINT}/indicator/:indicator`, () =>
        HttpResponse.json({}, { status: 404 }),
      ),
    )
    renderPage()
    await loaded()
    expect(
      await screen.findByText(/Provider definition could not refresh/),
    ).toBeInTheDocument()
    expect(screen.getByText(DEFAULT_INDICATOR.description)).toBeInTheDocument()
  })
  it('exposes missing years and precise values in the historical table', async () => {
    renderPage()
    await loaded()
    await userEvent.click(screen.getByText('View economic data table'))
    const table = screen.getByRole('table')
    expect(table).toBeVisible()
    expect(within(table).getByText('$125.00')).toBeInTheDocument()
    expect(within(table).getAllByText('Unavailable').length).toBeGreaterThan(0)
  })
  it('recovers from corrupted session storage', async () => {
    sessionStorage.setItem(ECONOMY_STORAGE_KEY, '{broken')
    renderPage()
    await loaded()
  })
})
