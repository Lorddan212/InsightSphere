import type { z } from 'zod'
import type { periodSchema } from '../schemas/crypto.schemas'

export type CryptoPeriod = z.infer<typeof periodSchema>
export interface CryptoAsset {
  id: string
  name: string
  symbol: string
  image: string | null
  price: number | null
  marketCap: number | null
  rank: number | null
  volume: number | null
  high: number | null
  low: number | null
  change24h: number | null
  supply: number | null
  updatedAt: string | null
}
export interface CryptoPricePoint {
  timestamp: number
  price: number | null
}
export interface GlobalCryptoMarket {
  marketCap: number | null
  volume: number | null
  bitcoinDominance: number | null
  ethereumDominance: number | null
  updatedAt: number | null
}
