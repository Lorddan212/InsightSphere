import type { WeatherLocation } from '../types/weather.types'

export const weatherKeys = {
  all: ['weather'] as const,
  forecast: (place: WeatherLocation) =>
    [
      'weather',
      'forecast',
      place.latitude,
      place.longitude,
      'metric',
      7,
      24,
    ] as const,
  search: (query: string) =>
    ['weather', 'search', query.trim().toLocaleLowerCase('en')] as const,
}
