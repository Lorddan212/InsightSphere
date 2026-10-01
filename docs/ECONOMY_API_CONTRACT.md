# Economy API contract

Verified against official documentation and live responses on 2026-09-30. Provider: World Bank Indicators API v2, World Development Indicators (source 2). No authentication or secrets are required for the public requests used here.

References: [call structures](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581-api-basic-call-structures), [countries](https://datahelpdesk.worldbank.org/knowledgebase/articles/898590-country-api-queries), [indicator metadata](https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries).

## Requests

Base: `https://api.worldbank.org/v2`. Always request `format=json`.

| Purpose                       | Path / parameters                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| Country metadata              | `/country?per_page=400&page=1`                                                      |
| Selected indicator definition | `/indicator/NY.GDP.MKTP.CD?source=2&per_page=100&page=1`                            |
| Selected country history      | `/country/NGA/indicator/NY.GDP.MKTP.CD?source=2&date=2017:2026&per_page=100&page=1` |

JSON is an array containing pagination metadata followed by rows. Pagination fields can be numbers or numeric strings. The default page size is 50; the service follows all reported pages and validates page numbers, totals, and completed row counts. Application safety bounds are 20 pages / 5,000 rows, not claimed provider limits. Changes to pagination mid-request are rejected rather than silently truncating. The reviewed documentation does not specify a universal requests-per-second quota; use long cache lifetimes and bounded retries.

Country metadata includes id, iso2Code, name, region, and incomeLevel. Live country response contained 295 entities including aggregates; region id `NA` / value `Aggregates` is excluded. Nigeria is `NGA` / `NG`. Selector wording includes economies as defined by the provider.

Series rows include indicator.id, countryiso3code, date (annual year string), and numeric or null value. The response also supplies lastupdated, which is the dataset update date, not the observation year. Dates/pair identity are checked; conflicting duplicate years fail validation. Only observations inside the requested range are retained even if the provider ignores a date filter. Explicit nulls stay null; absent years get only null chart-gap markers, never numerical estimates.

Multi-country semicolon syntax was verified with `NGA;GHA`. This application deliberately uses separate requests for at most three selected countries, sharing the same per-country query keys, so one comparison failure cannot invalidate the primary series.

HTTP failures use the shared request error architecture. World Bank also returns HTTP 200 with `[{ message: [...] }]` for invalid parameters; this is rejected as a provider error before row parsing. Metadata-only/null-row responses are empty only when the reported total is zero; inconsistent nonzero totals are invalid.

## Verified indicator registry

All ten metadata endpoints returned matching codes and source 2. Unit strings were empty; formatting is derived from the verified names/definitions below, not inferred from magnitude. Definitions are fetched for the active indicator; concise verified explanations remain available if metadata retrieval fails.

| Indicator             | Code              | Unit / change convention                                        |
| --------------------- | ----------------- | --------------------------------------------------------------- |
| GDP                   | NY.GDP.MKTP.CD    | Current USD; percent change, plus absolute change               |
| GDP growth            | NY.GDP.MKTP.KD.ZG | Annual percent; percentage-point change                         |
| GDP per capita        | NY.GDP.PCAP.CD    | Current USD per person; percent change                          |
| Population            | SP.POP.TOTL       | People, midyear estimate; percent change                        |
| Population growth     | SP.POP.GROW       | Annual percent; percentage-point change                         |
| Unemployment          | SL.UEM.TOTL.ZS    | Percent of labor force, modeled ILO estimate; percentage points |
| Inflation             | FP.CPI.TOTL.ZG    | Consumer prices, annual percent; percentage points              |
| Life expectancy       | SP.DYN.LE00.IN    | Years at birth; absolute change in years                        |
| Internet usage        | IT.NET.USER.ZS    | Percent of population; percentage points                        |
| Access to electricity | EG.ELC.ACCS.ZS    | Percent of population; percentage points                        |

GDP and GDP per capita use current prices and are not inflation-adjusted growth measures. Numeric increases are described neutrally.

## Product and caching decisions

- 10Y/20Y/30Y include the current UTC year and preceding 9/19/29 calendar years. MAX requests 1960 through the current year, matching WDI's historical window; coverage varies. The latest KPI is the latest non-null observation within the selected range and always shows its year.
- Nulls and missing recent years are not interpreted as zero. At least two valid points are required for change; relative change requires a positive starting value. Rate/share indicators use percentage points; life expectancy uses years.
- Comparison uses the latest year with non-null values for every selected country, when all series load. If no common year exists, show each latest observation with its own year and a prominent warning that years differ. Incomplete comparisons show available countries but never label them a complete same-year comparison.
- Country and indicator metadata remain fresh for seven days; annual series for 24 hours. Cache retention is seven days. No polling/focus refetch; refresh is explicit, with cached data retained on failure. Shared timeouts, cancellation, and bounded transient-error retries apply.
- Session storage retains country, indicator, period, and up to two distinct comparison countries. Stored values are validated against the registry and current country list. No URL-state contract or global rankings.

## Tests

Offline Vitest/RTL tests use the existing MSW 2.15.0 server and its unhandled/bypassed-request guards. Cover tuple validation, pagination, sorting, nulls, gaps, formatting, indicator-aware math, comparison years, persistence, loading, retry, empty and partial results. Browser verification is reported separately.
