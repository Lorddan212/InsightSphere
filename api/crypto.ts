import { createCryptoProxy } from '../server/crypto/proxy.ts'

// One handler per warm instance preserves the proxy's cache and request budget.
const handle = createCryptoProxy({
  apiKey: process.env.COINGECKO_API_KEY ?? '',
})

export default { fetch: handle }
