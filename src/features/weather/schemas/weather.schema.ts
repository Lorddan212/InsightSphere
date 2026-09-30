import { z } from 'zod'
import { timezoneSchema } from './location.schema'

const measurement = z.number().nullable().optional()
const percentage = z.number().min(0).max(100).nullable().optional()
const nonnegative = z.number().nonnegative().nullable().optional()
const code = z.number().int().nonnegative().nullable().optional()
const timestamp = z
  .number()
  .int()
  .min(0)
  .max(4_000_000_000)
  .nullable()
  .optional()
const series = (item: typeof measurement) => z.array(item).nullish()
const timeSeries = z
  .array(timestamp)
  .nullish()
  .transform((times) => times ?? [])

export const weatherSchema = z.object({
  timezone: timezoneSchema,
  current: z
    .object({
      time: timestamp,
      interval: nonnegative,
      temperature_2m: measurement,
      apparent_temperature: measurement,
      relative_humidity_2m: percentage,
      precipitation: nonnegative,
      weather_code: code,
      wind_speed_10m: nonnegative,
      wind_direction_10m: z.number().min(0).max(360).nullish(),
      wind_gusts_10m: nonnegative,
      surface_pressure: nonnegative,
    })
    .nullish(),
  hourly: z
    .object({
      time: timeSeries,
      temperature_2m: series(measurement),
      relative_humidity_2m: series(percentage),
      precipitation_probability: series(percentage),
      precipitation: series(nonnegative),
      wind_speed_10m: series(nonnegative),
      weather_code: series(code),
    })
    .nullish(),
  daily: z
    .object({
      time: timeSeries,
      temperature_2m_max: series(measurement),
      temperature_2m_min: series(measurement),
      weather_code: series(code),
      precipitation_probability_max: series(percentage),
      precipitation_sum: series(nonnegative),
      sunrise: series(timestamp),
      sunset: series(timestamp),
      wind_speed_10m_max: series(nonnegative),
    })
    .nullish(),
  current_units: z
    .object({
      time: z.literal('unixtime').optional(),
      interval: z.literal('seconds').optional(),
      temperature_2m: z.literal('°C').optional(),
      apparent_temperature: z.literal('°C').optional(),
      relative_humidity_2m: z.literal('%').optional(),
      precipitation: z.literal('mm').optional(),
      wind_speed_10m: z.literal('km/h').optional(),
      wind_gusts_10m: z.literal('km/h').optional(),
      wind_direction_10m: z.literal('°').optional(),
      surface_pressure: z.literal('hPa').optional(),
    })
    .optional(),
  hourly_units: z
    .object({
      time: z.literal('unixtime').optional(),
      temperature_2m: z.literal('°C').optional(),
      relative_humidity_2m: z.literal('%').optional(),
      precipitation_probability: z.literal('%').optional(),
      precipitation: z.literal('mm').optional(),
      wind_speed_10m: z.literal('km/h').optional(),
    })
    .optional(),
  daily_units: z
    .object({
      time: z.literal('unixtime').optional(),
      temperature_2m_max: z.literal('°C').optional(),
      temperature_2m_min: z.literal('°C').optional(),
      precipitation_probability_max: z.literal('%').optional(),
      precipitation_sum: z.literal('mm').optional(),
      wind_speed_10m_max: z.literal('km/h').optional(),
      sunrise: z.literal('unixtime').optional(),
      sunset: z.literal('unixtime').optional(),
    })
    .optional(),
})

export type WeatherResponse = z.infer<typeof weatherSchema>
