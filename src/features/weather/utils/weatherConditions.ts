import type { WeatherCondition } from '../types/weather.types'

const conditions: Record<number, WeatherCondition> = {
  0: { label: 'Clear sky', category: 'clear' },
  1: { label: 'Mainly clear', category: 'clear' },
  2: { label: 'Partly cloudy', category: 'cloud' },
  3: { label: 'Overcast', category: 'cloud' },
  45: { label: 'Fog', category: 'fog' },
  48: { label: 'Rime fog', category: 'fog' },
  51: { label: 'Light drizzle', category: 'drizzle' },
  53: { label: 'Moderate drizzle', category: 'drizzle' },
  55: { label: 'Dense drizzle', category: 'drizzle' },
  56: { label: 'Light freezing drizzle', category: 'drizzle' },
  57: { label: 'Dense freezing drizzle', category: 'drizzle' },
  61: { label: 'Slight rain', category: 'rain' },
  63: { label: 'Moderate rain', category: 'rain' },
  65: { label: 'Heavy rain', category: 'rain' },
  66: { label: 'Light freezing rain', category: 'rain' },
  67: { label: 'Heavy freezing rain', category: 'rain' },
  71: { label: 'Slight snowfall', category: 'snow' },
  73: { label: 'Moderate snowfall', category: 'snow' },
  75: { label: 'Heavy snowfall', category: 'snow' },
  77: { label: 'Snow grains', category: 'snow' },
  80: { label: 'Slight rain showers', category: 'rain' },
  81: { label: 'Moderate rain showers', category: 'rain' },
  82: { label: 'Violent rain showers', category: 'rain' },
  85: { label: 'Slight snow showers', category: 'snow' },
  86: { label: 'Heavy snow showers', category: 'snow' },
  95: { label: 'Thunderstorm', category: 'storm' },
  96: { label: 'Thunderstorm with slight hail', category: 'storm' },
  97: { label: 'Heavy thunderstorm', category: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', category: 'storm' },
}

export function weatherCondition(
  code: number | null | undefined,
): WeatherCondition {
  return (
    (code == null ? undefined : conditions[code]) ?? {
      label: 'Condition unavailable',
      category: 'unknown',
    }
  )
}
