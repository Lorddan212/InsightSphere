import { z } from 'zod'
import { findIndicator } from '../utils/economicIndicators'

const integer = z
  .union([z.number(), z.string().regex(/^\d+$/).transform(Number)])
  .pipe(z.number().int().nonnegative())
export const paginationSchema = z.object({
  page: integer,
  pages: integer,
  total: integer,
  lastupdated: z.iso.date().nullish(),
})
export const countrySchema = z.object({
  id: z.string().regex(/^[A-Z0-9]{3}$/),
  iso2Code: z.string().length(2),
  name: z.string().trim().min(1),
  region: z.object({ id: z.string(), value: z.string() }),
  incomeLevel: z.object({ value: z.string() }),
})
export const observationSchema = z.object({
  indicator: z.object({ id: z.string() }),
  countryiso3code: z.string(),
  date: z.string().regex(/^\d{4}$/),
  value: z.number().nullable(),
})
export const indicatorMetadataSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sourceNote: z.string(),
  source: z.object({ id: z.string(), value: z.string() }),
})
export const economySelectionSchema = z.object({
  country: z.string().regex(/^[A-Z0-9]{3}$/),
  indicator: z.string().refine((code) => !!findIndicator(code)),
  period: z.enum(['10Y', '20Y', '30Y', 'MAX']),
  comparisons: z.array(z.string().regex(/^[A-Z0-9]{3}$/)).max(2),
})
export type RawCountry = z.infer<typeof countrySchema>
export type RawObservation = z.infer<typeof observationSchema>
