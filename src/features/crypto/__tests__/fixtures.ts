export const assetFixture = (id = 'bitcoin') => ({
  id,
  name: id === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
  symbol: id === 'bitcoin' ? 'btc' : 'eth',
  image: null,
  current_price: 67450.23,
  market_cap: 1320000000000,
  market_cap_rank: id === 'bitcoin' ? 1 : 2,
  total_volume: 42600000000,
  high_24h: 68000,
  low_24h: 65000,
  price_change_percentage_24h: -1.25,
  circulating_supply: 19800000,
  last_updated: '2026-09-30T12:00:00Z',
})
export const historyFixture = {
  prices: [
    [1790769600000, 100],
    [1790773200000, null],
    [1790776800000, 120],
  ],
}
export const globalFixture = {
  data: {
    total_market_cap: { usd: 2500000000000 },
    total_volume: { usd: 100000000000 },
    market_cap_percentage: { btc: 53, eth: 12 },
    updated_at: 1790769600,
  },
}
export const cryptoError = (code: string) => ({
  error: { code, message: 'Do not display untrusted error text' },
})
