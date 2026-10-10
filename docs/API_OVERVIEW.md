# API overview

The provider contracts below are the detailed source of truth for the requests implemented by this checkout. Their dated provider observations are historical evidence, not fresh uptime or pricing guarantees.

| Domain   | Transport / provider                         | Data meaning                                                        | Contract                             |
| -------- | -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------ |
| Weather  | Browser → Open-Meteo forecast/geocoding      | Modelled current conditions and forecasts, not station observations | [Weather](WEATHER_API_CONTRACT.md)   |
| Currency | Browser → Frankfurter v2                     | Published reference exchange rates, not executable trading quotes   | [Currency](CURRENCY_API_CONTRACT.md) |
| Economy  | Browser → World Bank Indicators API v2 / WDI | Annual economic/development observations; publication can lag       | [Economy](ECONOMY_API_CONTRACT.md)   |
| Crypto   | Browser → same-origin proxy → CoinGecko Demo | Cached HTTP market observations, not a streaming feed               | [Crypto](CRYPTO_API_CONTRACT.md)     |

## Shared pipeline

`Fetch response → unknown JSON → runtime validation → normalization → TanStack Query cache → UI`

The hook initiates a service request through TanStack Query. Services validate and normalize the response before resolving it into the cache. Components consume domain models, not uncontrolled raw API payloads. Weather/currency/economy share a 15-second request deadline, cancellation and safe error classification. Transient network/timeout/5xx failures have bounded retries; client errors, invalid data and throttling do not trigger automatic retry loops. Crypto disables automatic retries to conserve credits.

| Resource                                           | Frontend freshness               |
| -------------------------------------------------- | -------------------------------- |
| Weather forecast / location search                 | 10 minutes / 24 hours            |
| Currency directory / latest pair / history         | 24 hours / 30 minutes / 1 hour   |
| Economic countries and definitions / annual series | 7 days / 24 hours                |
| Crypto markets and asset / global / history        | 1 minute / 2 minutes / 5 minutes |

No polling or refetch-on-focus is configured. Manual refresh may still receive server-cached crypto data. Cache age is not a promise that the provider has published a new observation. Empty, missing and partial data are explicit states; a failed provider does not invalidate unrelated summaries.

## Application-owned crypto API

Only GET is supported:

- `/api/crypto/global`
- `/api/crypto/markets?currency=usd`
- `/api/crypto/coins/:id?currency=usd`
- `/api/crypto/coins/:id/history?currency=usd&period=7D`

History periods are `24H`, `7D`, `30D`, `1Y`; the implementation bounds requests to 365 days. Unknown or duplicate parameters and arbitrary destination URLs are rejected. The [crypto contract](CRYPTO_API_CONTRACT.md) defines IDs, response schemas, safe error codes and request budgets. Production must mount the same handler without rewriting frontend calls to CoinGecko.

Only `COINGECKO_API_KEY` is required for full crypto functionality, and only on the server. The other domains require no application environment variables. Follow [security](SECURITY.md) and [deployment](DEPLOYMENT.md). Before public use, review the linked provider terms, attribution requirements and current account limits; this phase did not renew live-provider verification.
