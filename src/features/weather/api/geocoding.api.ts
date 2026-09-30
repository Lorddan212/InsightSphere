import { ApiError, requestJson } from '../../../lib/api/request'
import { geocodingSchema } from '../schemas/location.schema'
import type { WeatherLocation } from '../types/weather.types'

export const GEOCODING_ENDPOINT =
  'https://geocoding-api.open-meteo.com/v1/search'

export async function searchLocations(
  query: string,
  signal?: AbortSignal,
): Promise<WeatherLocation[]> {
  const name = query.trim()
  if (name.length < 3 || name.length > 100) return []
  const url = new URL(GEOCODING_ENDPOINT)
  url.search = new URLSearchParams({
    name,
    count: '8',
    language: 'en',
    format: 'json',
  }).toString()
  const result = geocodingSchema.safeParse(await requestJson(url, signal))
  if (!result.success)
    throw new ApiError(
      'invalid',
      'Location results arrived in an unexpected format. Please try again later.',
    )
  return (result.data.results ?? []).map((place) => ({
    id: place.id,
    name: place.name,
    country: place.country ?? '',
    region: place.admin1 ?? '',
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone ?? null,
  }))
}
