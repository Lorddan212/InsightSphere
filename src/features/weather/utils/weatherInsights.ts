import type { HourlyWeather } from '../types/weather.types'

export function weatherInsights(hourly: HourlyWeather[]) {
  const temperatures = hourly.flatMap((point) =>
    point.temperature === null ? [] : [point.temperature],
  )
  const humidity = hourly.flatMap((point) =>
    point.humidity === null ? [] : [point.humidity],
  )
  const winds = hourly.flatMap((point) =>
    point.wind === null ? [] : [point.wind],
  )
  const amounts = hourly.flatMap((point) =>
    point.precipitation === null ? [] : [point.precipitation],
  )
  return {
    low: temperatures.length ? Math.min(...temperatures) : null,
    high: temperatures.length ? Math.max(...temperatures) : null,
    humidityLow: humidity.length ? Math.min(...humidity) : null,
    humidityHigh: humidity.length ? Math.max(...humidity) : null,
    maxWind: winds.length ? Math.max(...winds) : null,
    precipitationTotal:
      hourly.length === 24 && amounts.length === 24
        ? amounts.reduce((sum, amount) => sum + amount, 0)
        : null,
  }
}
