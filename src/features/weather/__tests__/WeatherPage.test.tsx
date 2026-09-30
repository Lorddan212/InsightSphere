import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../../test/server'
import WeatherPage from '../components/WeatherPage'
import { LocationSearch } from '../components/LocationSearch'
import { FORECAST_ENDPOINT } from '../api/weather.api'
import { GEOCODING_ENDPOINT } from '../api/geocoding.api'
import { DEFAULT_LOCATION } from '../hooks/useWeatherLocation'
import { weatherKeys } from '../api/weather.keys'
import { weatherSchema } from '../schemas/weather.schema'
import { mapWeatherResponse } from '../utils/mapWeatherResponse'
import { forecastFixture, locationFixture } from './fixtures'

function renderWithQuery(
  ui = <WeatherPage />,
  client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  }),
) {
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  }
}

beforeEach(() => {
  sessionStorage.setItem(
    'insightsphere.weather.location',
    JSON.stringify(DEFAULT_LOCATION),
  )
  server.use(
    http.get(FORECAST_ENDPOINT, () => HttpResponse.json(forecastFixture())),
  )
})

describe('weather page states', () => {
  it('shows skeletons while waiting, then real success sections', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, async () => {
        await delay(150)
        return HttpResponse.json(forecastFixture())
      }),
    )
    renderWithQuery()
    expect(
      screen.getByRole('status', { name: 'Loading weather' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Current conditions' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '7-day forecast' }),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'Current conditions' }),
      ).getByText('29°C'),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('status', { name: 'Loading weather' }),
    ).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/NaN|undefined|Invalid Date/)
  })
  it('shows a useful error and successfully retries', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({ error: true }, { status: 400 }),
      ),
    )
    renderWithQuery()
    expect(
      await screen.findByRole('heading', { name: 'Weather could not load' }),
    ).toBeInTheDocument()
    server.use(
      http.get(FORECAST_ENDPOINT, () => HttpResponse.json(forecastFixture())),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(
      await screen.findByRole('heading', { name: 'Current conditions' }),
    ).toBeInTheDocument()
  })
  it('shows intentional empty and partial states', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({ timezone: 'Africa/Lagos' }),
      ),
    )
    renderWithQuery()
    expect(
      await screen.findByRole('heading', {
        name: 'Weather measurements unavailable',
      }),
    ).toBeInTheDocument()
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({
          timezone: 'Africa/Lagos',
          current: forecastFixture().current,
        }),
      ),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh weather' }),
    )
    expect(
      await screen.findByText(/Some measurements or forecast periods/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Hourly data unavailable' }),
    ).toBeInTheDocument()
  })
  it('preserves cached data when a refresh fails', async () => {
    const client = new QueryClient()
    client.setQueryData(
      weatherKeys.forecast(DEFAULT_LOCATION),
      mapWeatherResponse(weatherSchema.parse(forecastFixture())),
    )
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({ error: true }, { status: 400 }),
      ),
    )
    renderWithQuery(<WeatherPage />, client)
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh weather' }),
    )
    expect(
      await screen.findByText(
        'Refresh failed. Previously retrieved weather is still shown.',
      ),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole('region', { name: 'Current conditions' }),
      ).getByText('29°C'),
    ).toBeInTheDocument()
  })
  it('selects a searched location with the keyboard, requests new coordinates and persists it', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, () => HttpResponse.json(locationFixture)),
    )
    const requests: string[] = []
    server.use(
      http.get(FORECAST_ENDPOINT, ({ request }) => {
        requests.push(new URL(request.url).searchParams.get('latitude') ?? '')
        return HttpResponse.json({
          ...forecastFixture(),
          timezone:
            new URL(request.url).searchParams.get('latitude') === '35.6895'
              ? 'Asia/Tokyo'
              : 'Africa/Lagos',
        })
      }),
    )
    const user = userEvent.setup()
    const view = renderWithQuery()
    await screen.findByRole('heading', { name: 'Current conditions' })
    await user.type(
      screen.getByLabelText('Search for a city or place'),
      'Tokyo',
    )
    // Allow the real 400ms debounce plus rendering/network-mock scheduling
    // under the full parallel suite; retain the actual result assertion.
    const results = await screen.findByRole(
      'list',
      { name: 'Location results' },
      { timeout: 3000 },
    )
    const result = within(results).getByRole('button', { name: /Tokyo/ })
    result.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(requests).toContain('35.6895'))
    expect(
      screen.getByText('Selected location: Tokyo, Japan'),
    ).toBeInTheDocument()
    expect(
      JSON.parse(
        sessionStorage.getItem('insightsphere.weather.location') ?? '{}',
      ),
    ).toMatchObject({ name: 'Tokyo' })
    view.unmount()
    renderWithQuery()
    expect(
      screen.getByText('Selected location: Tokyo, Japan'),
    ).toBeInTheDocument()
  })
})

describe('location search', () => {
  it('debounces typing and handles no results without premature requests', async () => {
    const request = vi.fn()
    server.use(
      http.get(GEOCODING_ENDPOINT, () => {
        request()
        return HttpResponse.json({})
      }),
    )
    renderWithQuery(<LocationSearch onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search for a city or place')
    await userEvent.type(input, 'ab')
    expect(request).not.toHaveBeenCalled()
    await userEvent.type(input, 'zzzz')
    expect(request).not.toHaveBeenCalled()
    expect(
      await screen.findByText(
        'No locations found. Try a different spelling or a nearby city.',
      ),
    ).toBeInTheDocument()
    expect(request).toHaveBeenCalledTimes(1)
  })
  it('hides obsolete results as soon as the user changes the search', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, () => HttpResponse.json(locationFixture)),
    )
    renderWithQuery(<LocationSearch onSelect={vi.fn()} />)
    const input = screen.getByLabelText('Search for a city or place')
    await userEvent.type(input, 'Tokyo')
    await screen.findByRole('list', { name: 'Location results' })
    await userEvent.clear(input)
    await userEvent.type(input, 'London')
    expect(
      screen.queryByRole('list', { name: 'Location results' }),
    ).not.toBeInTheDocument()
  })
  it('renders search failure and permits a retry', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, () =>
        HttpResponse.json({ error: true }, { status: 400 }),
      ),
    )
    renderWithQuery(<LocationSearch onSelect={vi.fn()} />)
    await userEvent.type(
      screen.getByLabelText('Search for a city or place'),
      'Tokyo',
    )
    const retry = await screen.findByRole('button', {
      name: 'Retry location search',
    })
    server.use(
      http.get(GEOCODING_ENDPOINT, () => HttpResponse.json(locationFixture)),
    )
    await userEvent.click(retry)
    expect(
      await screen.findByRole('list', { name: 'Location results' }),
    ).toBeInTheDocument()
  })
})
