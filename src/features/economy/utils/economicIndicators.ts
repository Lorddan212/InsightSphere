import type { EconomicIndicator } from '../types/economy.types'

// Codes, definitions, and units verified against World Bank source 2 metadata.
export const ECONOMIC_INDICATORS: readonly EconomicIndicator[] = [
  {
    code: 'NY.GDP.MKTP.CD',
    name: 'GDP',
    unit: 'Current US$',
    format: 'usd',
    change: 'relative',
    description:
      'Total economic output at current prices in US dollars. Values are not adjusted for inflation.',
  },
  {
    code: 'NY.GDP.MKTP.KD.ZG',
    name: 'GDP growth',
    unit: 'Annual %',
    format: 'percent',
    change: 'points',
    description: 'Annual percentage change in GDP measured at constant prices.',
  },
  {
    code: 'NY.GDP.PCAP.CD',
    name: 'GDP per capita',
    unit: 'Current US$ per person',
    format: 'usd',
    change: 'relative',
    description:
      'GDP at current prices divided by population, expressed in US dollars per person.',
  },
  {
    code: 'SP.POP.TOTL',
    name: 'Population',
    unit: 'People',
    format: 'people',
    change: 'relative',
    description:
      'Midyear estimate of residents, regardless of legal status or citizenship.',
  },
  {
    code: 'SP.POP.GROW',
    name: 'Population growth',
    unit: 'Annual %',
    format: 'percent',
    change: 'points',
    description: 'Annual exponential growth rate of the midyear population.',
  },
  {
    code: 'SL.UEM.TOTL.ZS',
    name: 'Unemployment',
    unit: '% of labor force',
    format: 'percent',
    change: 'points',
    description:
      'Share of the labor force without work but available for and seeking employment. Modeled ILO estimate.',
  },
  {
    code: 'FP.CPI.TOTL.ZG',
    name: 'Inflation',
    unit: 'Consumer prices, annual %',
    format: 'percent',
    change: 'points',
    description:
      'Annual change in the cost of a consumer basket measured by the consumer price index.',
  },
  {
    code: 'SP.DYN.LE00.IN',
    name: 'Life expectancy',
    unit: 'Years at birth',
    format: 'years',
    change: 'absolute',
    description:
      'Expected years of life at birth if prevailing mortality patterns remain unchanged.',
  },
  {
    code: 'IT.NET.USER.ZS',
    name: 'Internet usage',
    unit: '% of population',
    format: 'percent',
    change: 'points',
    description:
      'Share of individuals who used the Internet from any location in the last three months.',
  },
  {
    code: 'EG.ELC.ACCS.ZS',
    name: 'Access to electricity',
    unit: '% of population',
    format: 'percent',
    change: 'points',
    description: 'Share of the population with access to electricity.',
  },
]
export const DEFAULT_COUNTRY_ID = 'NGA'
export const DEFAULT_INDICATOR = ECONOMIC_INDICATORS[0]
export function findIndicator(code: string): EconomicIndicator | undefined {
  return ECONOMIC_INDICATORS.find((indicator) => indicator.code === code)
}
