# Weather API contract

Established before implementation on 2026-09-30 against the official [forecast documentation](https://open-meteo.com/en/docs) and [geocoding documentation](https://open-meteo.com/en/docs/geocoding-api). This is a public, non-commercial portfolio integration; no credentials or environment variables are required. Commercial use requires reviewing the provider's terms and service tier.

## Requests

`GET https://api.open-meteo.com/v1/forecast`

- One validated latitude/longitude pair; `timezone=auto`, `timeformat=unixtime`.
- `temperature_unit=celsius`, `wind_speed_unit=kmh`, `precipitation_unit=mm`.
- Seven daily forecasts and 24 hourly points starting at the current hour (`forecast_days=7`, `forecast_hours=24`).
- Current: temperature_2m, apparent_temperature, relative_humidity_2m, precipitation, weather_code, wind_speed_10m, wind_direction_10m, wind_gusts_10m, surface_pressure.
- Hourly: temperature_2m, relative_humidity_2m, precipitation_probability, precipitation, wind_speed_10m, weather_code.
- Daily: temperature_2m_max, temperature_2m_min, weather_code, precipitation_probability_max, precipitation_sum, sunrise, sunset, wind_speed_10m_max.

`GET https://geocoding-api.open-meteo.com/v1/search`

- `name` is trimmed user input (3–100 characters), `count=8`, `language=en`, `format=json`.
- UI waits 400ms after input changes. Blank/short searches do not request data.
- Results consume id, name, country, admin1, latitude, longitude, and timezone. Country/region/timezone may be omitted. Missing results means an empty list.

## Validation and normalization

JSON is `unknown` until Zod validation succeeds. Provider errors (`error: true`) and non-success HTTP responses never enter domain models. Response timezone must be a valid IANA timezone. Unit metadata is checked when supplied, so mismatched units cannot be silently labelled metric. Null/missing measurements normalize to null, short arrays retain index alignment, and empty sections remain empty. Invalid structural types reject the response rather than silently inventing values.

Epoch seconds become milliseconds and are rendered with `Intl.DateTimeFormat` using the response timezone, including daily labels and sunrise/sunset. No browser-local timestamp parsing or fixed-offset DST arithmetic. WMO codes map centrally to labels and icon categories, with an unknown-condition fallback.

## Failure, caching, and UI semantics

Fetch propagates query cancellation and has a 15-second timeout. HTTP 400, malformed JSON, and invalid contracts are not retried automatically. Network/timeouts and 5xx responses get at most two retries; rate limits require manual retry to avoid hammering the provider. Forecasts stay fresh for 10 minutes and cached for 30 minutes; searches stay fresh for 24 hours. No polling or focus refetching.

Current values are modelled conditions, not station observations. Current precipitation uses the response interval (normally 15 minutes); hourly amounts cover the preceding hour. Hourly humidity ranges, maximum wind, and precipitation totals are explicitly derived from the displayed forecast window; incomplete totals are not presented as complete.

Cached data remains visible if a refresh fails, with a warning and its retrieval time. Fetch time is labelled separately from model valid time. Selection changes do not show the previous city's data. Session storage preserves the selected place across navigation/reload; URL sharing is deferred to keep scope focused. No geolocation permission is requested.

## Verification strategy

MSW intercepts both endpoints for offline Vitest/Testing Library tests: request contract, response mapping, missing/invalid data, retry classification, errors, search, cancellation, and UI states. Live requests and browser checks are separate smoke checks. Postman CLI is not installed in this environment; no Postman cloud resources or reports are created.
