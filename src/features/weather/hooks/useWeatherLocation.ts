import { useState } from 'react'
import { locationSchema } from '../schemas/location.schema'
import type { WeatherLocation } from '../types/weather.types'

export const DEFAULT_LOCATION: WeatherLocation = {
  id: 2352778,
  name: 'Abuja',
  country: 'Nigeria',
  region: 'Federal Capital Territory',
  latitude: 9.05785,
  longitude: 7.49508,
  timezone: 'Africa/Lagos',
}
const STORAGE_KEY = 'insightsphere.weather.location'
let sessionLocation = DEFAULT_LOCATION

function readLocation() {
  try {
    const raw: unknown = JSON.parse(
      sessionStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    const parsed = locationSchema.safeParse(raw)
    if (parsed.success) return parsed.data
  } catch {
    /* Invalid or blocked storage falls back to the current session. */
  }
  return sessionLocation
}

export function useWeatherLocation() {
  const [location, setLocation] = useState<WeatherLocation>(readLocation)
  const selectLocation = (value: WeatherLocation) => {
    sessionLocation = value
    setLocation(value)
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* Selection remains available in memory. */
    }
  }
  return { location, selectLocation }
}
