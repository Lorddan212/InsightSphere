import { useQuery } from '@tanstack/react-query'
import { getWeather } from '../api/weather.api'
import { weatherKeys } from '../api/weather.keys'
import { retryTransientError } from '../../../lib/api/request'
import type { WeatherLocation } from '../types/weather.types'

export const WEATHER_STALE_TIME = 10 * 60_000

export function useWeather(location: WeatherLocation) {
  return useQuery({
    queryKey: weatherKeys.forecast(location),
    queryFn: ({ signal }) => getWeather(location, signal),
    staleTime: WEATHER_STALE_TIME,
    gcTime: 30 * 60_000,
    retry: retryTransientError,
    refetchOnWindowFocus: false,
  })
}
