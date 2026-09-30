import { describe, expect, it } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { server } from '../../../test/server'
import { weatherSchema } from '../schemas/weather.schema'
import { mapWeatherResponse } from '../utils/mapWeatherResponse'
import { weatherCondition } from '../utils/weatherConditions'
import {
  formatMeasurement,
  formatWeatherTime,
  localDateKey,
  windDirection,
} from '../utils/weatherFormatters'
import { weatherInsights } from '../utils/weatherInsights'
import { getWeather, FORECAST_ENDPOINT } from '../api/weather.api'
import { searchLocations, GEOCODING_ENDPOINT } from '../api/geocoding.api'
import { weatherKeys } from '../api/weather.keys'
import { DEFAULT_LOCATION } from '../hooks/useWeatherLocation'
import { ApiError, retryTransientError } from '../../../lib/api/request'
import { forecastFixture, locationFixture, START } from './fixtures'

describe('weather contract and normalization', () => {
  it('maps provider arrays into aligned domain records with real zeroes preserved', () => {
    const result = mapWeatherResponse(weatherSchema.parse(forecastFixture()))
    expect(result.current).toMatchObject({
      time: START * 1000,
      temperature: 29,
      precipitation: 0,
      condition: { label: 'Partly cloudy' },
    })
    expect(result.hourly).toHaveLength(24)
    expect(result.daily).toHaveLength(7)
    expect(result.partial).toBe(false)
  })
  it('preserves partial data and missing indexes rather than shifting values', () => {
    const raw = forecastFixture()
    const result = mapWeatherResponse(
      weatherSchema.parse({
        ...raw,
        current: { ...raw.current, temperature_2m: null },
        hourly: { time: [START, null, START + 7200], temperature_2m: [28, 29] },
        daily: null,
      }),
    )
    expect(result.current?.temperature).toBeNull()
    expect(result.hourly.map((point) => point.temperature)).toEqual([28, null])
    expect(result.daily).toEqual([])
    expect(result.partial).toBe(true)
  })
  it('handles entirely empty data and unknown condition codes', () => {
    const result = mapWeatherResponse(
      weatherSchema.parse({ timezone: 'Africa/Lagos', hourly: { time: [] } }),
    )
    expect(result.hasMeasurements).toBe(false)
    expect(weatherCondition(999)).toEqual({
      label: 'Condition unavailable',
      category: 'unknown',
    })
    expect(weatherCondition(null).category).toBe('unknown')
  })
  it.each([
    [0, 'clear'],
    [48, 'fog'],
    [56, 'drizzle'],
    [67, 'rain'],
    [77, 'snow'],
    [86, 'snow'],
    [97, 'storm'],
    [99, 'storm'],
  ])('maps WMO code %s', (code, category) => {
    expect(weatherCondition(Number(code)).category).toBe(category)
  })
  it('rejects wrong value types, impossible humidity, timezone and unit mismatches', () => {
    const raw = forecastFixture()
    for (const invalid of [
      { ...raw, current: { temperature_2m: 'hot' } },
      { ...raw, current: { relative_humidity_2m: 130 } },
      { ...raw, timezone: 'not/a/timezone' },
      { ...raw, current_units: { temperature_2m: '°F' } },
    ])
      expect(weatherSchema.safeParse(invalid).success).toBe(false)
  })
  it('does not invent a complete precipitation total from missing hours', () => {
    const data = mapWeatherResponse(weatherSchema.parse(forecastFixture()))
    expect(weatherInsights(data.hourly).precipitationTotal).toBe(0)
    expect(
      weatherInsights(data.hourly.slice(0, 23)).precipitationTotal,
    ).toBeNull()
    expect(
      weatherInsights([{ ...data.hourly[0], precipitation: null }])
        .precipitationTotal,
    ).toBeNull()
  })
})

describe('formatting in the selected location timezone', () => {
  it('uses metric units and intentional unavailable values', () => {
    expect(formatMeasurement(0, 'precipitation')).toBe('0 mm')
    expect(formatMeasurement(29.2, 'temperature')).toBe('29°C')
    expect(formatMeasurement(null, 'humidity')).toBe('Unavailable')
    expect(formatMeasurement(NaN, 'wind')).toBe('Unavailable')
    expect(windDirection(360)).toBe('N (360°)')
  })
  it('formats across date boundaries independently of the browser timezone', () => {
    const timestamp = Date.UTC(2026, 8, 30, 23)
    expect(formatWeatherTime(timestamp, 'Asia/Tokyo')).toBe('08:00')
    expect(localDateKey(timestamp, 'Asia/Tokyo')).toBe('2026-10-01')
    expect(localDateKey(timestamp, 'America/New_York')).toBe('2026-09-30')
    expect(formatWeatherTime(null, 'Africa/Lagos')).toBe('Unavailable')
  })
  it('handles daylight-saving transitions with the IANA timezone', () => {
    expect(formatWeatherTime(Date.UTC(2026, 2, 8, 6), 'America/New_York')).toBe(
      '01:00',
    )
    expect(formatWeatherTime(Date.UTC(2026, 2, 8, 7), 'America/New_York')).toBe(
      '03:00',
    )
  })
})

describe('services against mocked HTTP contracts', () => {
  it('requests the contracted variables, units and horizon', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, ({ request }) => {
        const params = new URL(request.url).searchParams
        expect(params.get('latitude')).toBe(String(DEFAULT_LOCATION.latitude))
        expect(params.get('forecast_hours')).toBe('24')
        expect(params.get('forecast_days')).toBe('7')
        expect(params.get('timeformat')).toBe('unixtime')
        expect(params.get('timezone')).toBe('auto')
        expect(params.get('wind_speed_unit')).toBe('kmh')
        expect(params.get('current')).toContain('surface_pressure')
        return HttpResponse.json(forecastFixture())
      }),
    )
    expect((await getWeather(DEFAULT_LOCATION)).current?.temperature).toBe(29)
  })
  it('normalizes locations including missing optional metadata', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, ({ request }) => {
        expect(new URL(request.url).searchParams.get('name')).toBe('Tokyo')
        return HttpResponse.json({
          results: [
            locationFixture.results[0],
            { id: 2, name: 'Remote place', latitude: 1, longitude: 2 },
          ],
        })
      }),
    )
    const results = await searchLocations(' Tokyo ')
    expect(results[0]).toMatchObject({
      name: 'Tokyo',
      region: 'Tokyo',
      timezone: 'Asia/Tokyo',
    })
    expect(results[1]).toMatchObject({
      country: '',
      region: '',
      timezone: null,
    })
  })
  it('returns no results without a request for short searches', async () => {
    expect(await searchLocations(' a ')).toEqual([])
  })
  it('accepts an absent results array as no matches', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, () =>
        HttpResponse.json({ generationtime_ms: 0.1 }),
      ),
    )
    expect(await searchLocations('zzzzzzzz')).toEqual([])
  })
  it('rejects malformed coordinates in search results', async () => {
    server.use(
      http.get(GEOCODING_ENDPOINT, () =>
        HttpResponse.json({
          results: [{ ...locationFixture.results[0], latitude: 100 }],
        }),
      ),
    )
    await expect(searchLocations('Tokyo')).rejects.toMatchObject({
      kind: 'invalid',
    })
  })
  it.each([400, 429, 503])('classifies HTTP %s responses', async (status) => {
    server.use(
      http.get(FORECAST_ENDPOINT, () =>
        HttpResponse.json({ error: true, reason: 'fixture error' }, { status }),
      ),
    )
    await expect(getWeather(DEFAULT_LOCATION)).rejects.toMatchObject({
      kind: 'http',
      status,
    })
  })
  it('classifies network errors without displaying raw exceptions', async () => {
    server.use(http.get(FORECAST_ENDPOINT, () => HttpResponse.error()))
    await expect(getWeather(DEFAULT_LOCATION)).rejects.toMatchObject({
      kind: 'network',
    })
  })
  it('rejects invalid JSON and invalid success payloads', async () => {
    server.use(http.get(FORECAST_ENDPOINT, () => new HttpResponse('not json')))
    await expect(getWeather(DEFAULT_LOCATION)).rejects.toMatchObject({
      kind: 'invalid',
    })
    server.use(
      http.get(FORECAST_ENDPOINT, () => HttpResponse.json({ timezone: false })),
    )
    await expect(getWeather(DEFAULT_LOCATION)).rejects.toMatchObject({
      kind: 'invalid',
    })
  })
  it('propagates cancellation rather than converting it into a provider error', async () => {
    server.use(
      http.get(FORECAST_ENDPOINT, async () => {
        await delay(100)
        return HttpResponse.json(forecastFixture())
      }),
    )
    const controller = new AbortController()
    const request = getWeather(DEFAULT_LOCATION, controller.signal)
    controller.abort()
    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
  it('retries only transient failures and bounds attempts', () => {
    expect(retryTransientError(0, new ApiError('network', 'offline'))).toBe(
      true,
    )
    expect(retryTransientError(2, new ApiError('network', 'offline'))).toBe(
      false,
    )
    expect(retryTransientError(0, new ApiError('invalid', 'schema'))).toBe(
      false,
    )
    expect(retryTransientError(0, new ApiError('http', 'bad', 400))).toBe(false)
    expect(retryTransientError(0, new ApiError('http', 'limited', 429))).toBe(
      false,
    )
    expect(retryTransientError(0, new ApiError('http', 'down', 503))).toBe(true)
  })
  it('keys forecasts by coordinates and searches by normalized input', () => {
    expect(weatherKeys.search(' Tokyo ')).toEqual(weatherKeys.search('tokyo'))
    expect(weatherKeys.forecast(DEFAULT_LOCATION)).not.toEqual(
      weatherKeys.forecast({ ...DEFAULT_LOCATION, longitude: 0 }),
    )
  })
})
