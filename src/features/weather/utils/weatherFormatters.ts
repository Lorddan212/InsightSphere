export const METRIC_UNITS = {
  temperature: '°C',
  humidity: '%',
  probability: '%',
  wind: 'km/h',
  precipitation: 'mm',
  pressure: 'hPa',
} as const
type Measurement = keyof typeof METRIC_UNITS

export function formatMeasurement(
  value: number | null | undefined,
  kind: Measurement,
): string {
  if (value == null || !Number.isFinite(value)) return 'Unavailable'
  const digits = kind === 'precipitation' ? 1 : 0
  const unit = METRIC_UNITS[kind]
  return `${new Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(value)}${unit === '%' || unit === '°C' ? '' : ' '}${unit}`
}

export function formatWeatherTime(
  time: number | null | undefined,
  timezone: string,
  mode: 'hour' | 'day' | 'full' = 'hour',
): string {
  if (time == null || !Number.isFinite(time)) return 'Unavailable'
  const options: Intl.DateTimeFormatOptions =
    mode === 'day'
      ? { weekday: 'short', month: 'short', day: 'numeric' }
      : mode === 'full'
        ? {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          }
        : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  return new Intl.DateTimeFormat('en-GB', {
    ...options,
    timeZone: timezone,
  }).format(time)
}

export function localDateKey(time: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(time)
}

export function windDirection(degrees: number | null): string {
  if (degrees === null) return 'Direction unavailable'
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return `${directions[Math.round(degrees / 45) % 8]} (${Math.round(degrees)}°)`
}
