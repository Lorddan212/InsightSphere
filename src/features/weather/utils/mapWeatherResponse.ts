import type { WeatherResponse } from '../schemas/weather.schema'
import type { WeatherData } from '../types/weather.types'
import { weatherCondition } from './weatherConditions'

const milliseconds = (seconds: number | null | undefined) =>
  seconds == null ? null : seconds * 1000

export function mapWeatherResponse(raw: WeatherResponse): WeatherData {
  const c = raw.current
  const current =
    c?.time == null
      ? null
      : {
          time: c.time * 1000,
          interval: c.interval ?? null,
          temperature: c.temperature_2m ?? null,
          feelsLike: c.apparent_temperature ?? null,
          humidity: c.relative_humidity_2m ?? null,
          precipitation: c.precipitation ?? null,
          wind: c.wind_speed_10m ?? null,
          direction: c.wind_direction_10m ?? null,
          gust: c.wind_gusts_10m ?? null,
          pressure: c.surface_pressure ?? null,
          condition: weatherCondition(c.weather_code),
        }
  const h = raw.hourly
  const hourly = (h?.time ?? [])
    .flatMap((time, i) =>
      time == null
        ? []
        : [
            {
              time: time * 1000,
              temperature: h?.temperature_2m?.[i] ?? null,
              humidity: h?.relative_humidity_2m?.[i] ?? null,
              probability: h?.precipitation_probability?.[i] ?? null,
              precipitation: h?.precipitation?.[i] ?? null,
              wind: h?.wind_speed_10m?.[i] ?? null,
              condition: weatherCondition(h?.weather_code?.[i]),
            },
          ],
    )
    .sort((a, b) => a.time - b.time)
    .slice(0, 24)
  const d = raw.daily
  const daily = (d?.time ?? [])
    .flatMap((time, i) =>
      time == null
        ? []
        : [
            {
              time: time * 1000,
              high: d?.temperature_2m_max?.[i] ?? null,
              low: d?.temperature_2m_min?.[i] ?? null,
              probability: d?.precipitation_probability_max?.[i] ?? null,
              precipitation: d?.precipitation_sum?.[i] ?? null,
              sunrise: milliseconds(d?.sunrise?.[i]),
              sunset: milliseconds(d?.sunset?.[i]),
              wind: d?.wind_speed_10m_max?.[i] ?? null,
              condition: weatherCondition(d?.weather_code?.[i]),
            },
          ],
    )
    .sort((a, b) => a.time - b.time)
    .slice(0, 7)
  const missing = (point: object) =>
    Object.values(point).some(
      (value) =>
        value === null ||
        (typeof value === 'object' &&
          value !== null &&
          'category' in value &&
          value.category === 'unknown'),
    )
  const hasMeasurements =
    (current !== null &&
      Object.entries(current).some(
        ([key, value]) =>
          key !== 'time' && key !== 'interval' && typeof value === 'number',
      )) ||
    hourly.some((point) =>
      [
        point.temperature,
        point.humidity,
        point.precipitation,
        point.wind,
        point.probability,
      ].some((value) => value !== null),
    ) ||
    daily.some((point) =>
      [
        point.high,
        point.low,
        point.precipitation,
        point.wind,
        point.probability,
      ].some((value) => value !== null),
    )
  return {
    timezone: raw.timezone,
    current,
    hourly,
    daily,
    hasMeasurements,
    partial:
      !current ||
      missing(current) ||
      hourly.length < 24 ||
      daily.length < 7 ||
      hourly.some(missing) ||
      daily.some(missing),
  }
}
