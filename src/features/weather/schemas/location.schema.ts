import { z } from 'zod'

export const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}, 'Expected a valid timezone')

const coordinates = {
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}

export const locationSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1).max(200),
  country: z.string().max(200),
  region: z.string().max(200),
  ...coordinates,
  timezone: timezoneSchema.nullable(),
})

export const geocodingSchema = z.object({
  results: z
    .array(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(200),
        ...coordinates,
        country: z.string().max(200).nullish(),
        admin1: z.string().max(200).nullish(),
        timezone: timezoneSchema.nullish(),
      }),
    )
    .nullish(),
})
