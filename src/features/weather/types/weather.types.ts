export interface WeatherLocation {
  id: number
  name: string
  country: string
  region: string
  latitude: number
  longitude: number
  timezone: string | null
}

export type ConditionCategory =
  'clear' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm' | 'unknown'
export interface WeatherCondition {
  label: string
  category: ConditionCategory
}

export interface CurrentWeather {
  time: number
  interval: number | null
  temperature: number | null
  feelsLike: number | null
  humidity: number | null
  precipitation: number | null
  wind: number | null
  direction: number | null
  gust: number | null
  pressure: number | null
  condition: WeatherCondition
}

export interface HourlyWeather {
  time: number
  temperature: number | null
  humidity: number | null
  probability: number | null
  precipitation: number | null
  wind: number | null
  condition: WeatherCondition
}

export interface DailyWeather {
  time: number
  high: number | null
  low: number | null
  probability: number | null
  precipitation: number | null
  sunrise: number | null
  sunset: number | null
  wind: number | null
  condition: WeatherCondition
}

export interface WeatherData {
  timezone: string
  current: CurrentWeather | null
  hourly: HourlyWeather[]
  daily: DailyWeather[]
  partial: boolean
  hasMeasurements: boolean
}
