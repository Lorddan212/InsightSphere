import type { EconomicPeriod, EconomicRange } from '../types/economy.types'
export const ECONOMIC_PERIODS: EconomicPeriod[] = ['10Y', '20Y', '30Y', 'MAX']
export function getEconomicRange(
  period: EconomicPeriod,
  now = new Date(),
): EconomicRange {
  const to = now.getUTCFullYear()
  return {
    from: period === 'MAX' ? 1960 : to - Number.parseInt(period) + 1,
    to,
  }
}
