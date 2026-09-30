import { ApiError, requestJson } from '../../../lib/api/request'
import { weatherSchema } from '../schemas/weather.schema'
import { mapWeatherResponse } from '../utils/mapWeatherResponse'
import type { WeatherLocation } from '../types/weather.types'

export const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast'
export const FORECAST_PARAMETERS = {
  timezone: 'auto',
  timeformat: 'unixtime',
  forecast_days: '7',
  forecast_hours: '24',
  temperature_unit: 'celsius',
  wind_speed_unit: 'kmh',
  precipitation_unit: 'mm',
  current:
    'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure',
  hourly:
    'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code',
  daily:
    'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max,precipitation_sum,sunrise,sunset,wind_speed_10m_max',
} as const

export async function getWeather(
  location: WeatherLocation,
  signal?: AbortSignal,
) {
  const url = new URL(FORECAST_ENDPOINT)
  url.search = new URLSearchParams({
    ...FORECAST_PARAMETERS,
    latitude: String(location.latitude),
    longitude: String(location.longitude),
  }).toString()
  const raw = await requestJson(url, signal)
  const result = weatherSchema.safeParse(raw)
  if (!result.success)
    throw new ApiError(
      'invalid',
      'Weather data arrived in an unexpected format. Please try again later.',
    )
  return mapWeatherResponse(result.data)
}
