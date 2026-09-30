# Currency API contract

Verified 2026-09-30 against [official Frankfurter v2 documentation](https://frankfurter.dev/) and live JSON responses. No API key or confidential configuration is required. v1 is deprecated; this feature uses v2 and its default blended sources.

## Requests

Base URL: `https://api.frankfurter.dev/v2`.

| Resource          | Request                                                        | Required response fields               |
| ----------------- | -------------------------------------------------------------- | -------------------------------------- |
| Active currencies | `GET /currencies`                                              | Array of `{ iso_code, name }`          |
| Latest pair       | `GET /rate/USD/NGN`                                            | `{ date, base, quote, rate }`          |
| History           | `GET /rates?base=USD&quotes=NGN&from=2026-09-24&to=2026-09-30` | Array of `{ date, base, quote, rate }` |

Dates are valid `YYYY-MM-DD` calendar dates. Codes normalize to uppercase. Pair identity must match the request. Numeric rates must be finite and positive; explicitly null or absent rates are retained as missing measurements. Malformed structures, dates, wrong pairs, and conflicting duplicate dates fail validation. History is sorted and restricted to the requested inclusive bounds. Missing dates are not synthesized. Single-date history is available through `date` but is not needed by this UI.

The live currency list contained 166 active currencies, including NGN. The latest USD/NGN and seven-day history requests returned HTTP 200. Thus USD/NGN is the initial default; if later unavailable in the list, prefer USD/EUR, then available codes. No hardcoded rate fallback exists.

## Errors, caching, and interpretation

Provider errors use HTTP 400 (parameters), 404 (missing rate/resource), or 422 (unprocessable request) with `{ status, message }`. Do not render raw provider messages. Shared requests enforce a 15-second timeout, cancellation, JSON parsing, and safe errors. Currency services give pair-specific errors for 400/404/422. Retry at most twice for network, timeout, or 5xx failures; do not automatically retry 429 or validation errors.

Cache currency metadata for 24 hours, latest rates for 30 minutes, and history for one hour. Disable focus refetch and polling. Keys include pair and history date bounds; amounts never enter keys. Refresh is explicit, and failed refreshes retain cached data with a warning. Published dates are displayed independently of retrieval time.

These are reference mid-market rates, not trading ticks or a bank's conversion quote. Default blended observations can be revised. Coverage and publication dates vary by pair; missing dates need not imply a provider failure. There are no documented daily/monthly quotas, but abuse rate limiting applies. Respect underlying provider terms.

## Product decisions

- Seven days includes today and the previous six UTC dates. Month/year periods subtract calendar months with end-of-month clamping; both endpoints are included.
- Equal currencies convert at the mathematical identity rate of 1 without rate/history requests. No fabricated historical series or provider timestamp is attached.
- Convert locally using the validated cached rate. Accept non-negative plain decimal amounts up to 1 trillion with at most six decimal places; reject scientific notation, separators, and non-finite/overflowing results. Intl formats output using each currency's fraction digits. This is an estimate, not settlement arithmetic.
- KPIs use only available numeric observations: first/last for change, minimum/maximum for low/high. Fewer than two observations means no change estimate. Null observations remain chart gaps. A chronological table is the chart alternative.
- Validate sessionStorage selections and recheck codes against fetched metadata; storage failure leaves the feature usable in memory. No URL-state contract is introduced.

## Verification strategy

Vitest + MSW cover this contract, malformed responses, errors/retry, calculations, selection behavior, and cached failures offline. Live browser checks are recorded separately in Phase 3 verification. No Postman cloud workspace is modified.
