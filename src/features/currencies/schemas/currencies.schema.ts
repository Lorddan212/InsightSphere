import { z } from 'zod'

export const currencyCodeSchema = z
  .string()
  .regex(/^[a-zA-Z]{3}$/)
  .transform((code) => code.toUpperCase())
const dateSchema = z.iso.date()
export const currenciesSchema = z.array(
  z.object({ iso_code: currencyCodeSchema, name: z.string().trim().min(1) }),
)
export const rateSchema = z.object({
  date: dateSchema,
  base: currencyCodeSchema,
  quote: currencyCodeSchema,
  rate: z.number().positive().nullish(),
})
export const historySchema = z.array(rateSchema)
export const selectionSchema = z.object({
  base: currencyCodeSchema,
  quote: currencyCodeSchema,
  period: z.enum(['7D', '1M', '3M', '1Y']),
})
export type RawRate = z.infer<typeof rateSchema>
