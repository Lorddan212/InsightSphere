import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { EmptyState, ErrorState } from '../../../components/ui/States'
import {
  useEconomicSeries,
  useEconomyCountries,
  useIndicatorMetadata,
} from '../hooks/useEconomyQueries'
import { useEconomySelection } from '../hooks/useEconomySelection'
import { DEFAULT_INDICATOR, findIndicator } from '../utils/economicIndicators'
import { ECONOMIC_PERIODS, getEconomicRange } from '../utils/economicPeriods'
import { EconomyLoading } from './EconomyLoading'
import { EconomySelectors } from './EconomySelectors'
import { EconomicMetrics } from './EconomicMetrics'
import { EconomicChart } from './EconomicChart'
import { EconomicComparison } from './EconomicComparison'

export default function EconomyPage() {
  const countries = useEconomyCountries()
  const { selection, select } = useEconomySelection(countries.data ?? [])
  const indicator =
    findIndicator(selection?.indicator ?? '') ?? DEFAULT_INDICATOR
  const metadata = useIndicatorMetadata(indicator.code, !!selection)
  const [today, setToday] = useState(() => new Date())
  const range = getEconomicRange(selection?.period ?? '10Y', today)
  const series = useEconomicSeries(
    selection ? [selection.country, ...selection.comparisons] : [],
    indicator.code,
    range,
  )
  const primary = series[0]
  const country = countries.data?.find((item) => item.id === selection?.country)
  const refreshing =
    countries.isFetching ||
    metadata.isFetching ||
    series.some((query) => query.isFetching)
  function refresh() {
    const now = new Date()
    setToday(now)
    void countries.refetch()
    void metadata.refetch()
    if (now.getUTCFullYear() === range.to)
      series.forEach((query) => {
        void query.refetch()
      })
  }
  return (
    <>
      <PageHeader
        title="Economic Analytics"
        description="Explore annual economic and development indicators, their observation years, and comparable country data."
        action={
          <Button onClick={refresh} disabled={refreshing}>
            <RefreshCw aria-hidden="true" size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh economy'}
          </Button>
        }
      />
      {countries.isPending && <EconomyLoading label="Loading countries" />}
      {countries.isError && !countries.data && (
        <ErrorState
          headingLevel="h2"
          title="Countries could not load"
          description={countries.error.message}
          onRetry={() => void countries.refetch()}
        />
      )}
      {countries.isError && countries.data && (
        <p role="status" className="mb-4 text-sm text-muted">
          Country metadata refresh failed. Previously retrieved countries are
          still shown.
        </p>
      )}
      {countries.data?.length === 0 && (
        <EmptyState
          title="No countries available"
          description="World Bank returned no selectable countries or economies. Try refreshing later."
        />
      )}
      {selection && country && (
        <>
          <EconomySelectors
            countries={countries.data ?? []}
            selection={selection}
            onChange={select}
          />
          <div className="mb-5">
            <h2 className="text-2xl font-semibold">
              {country.name} · {indicator.name}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {country.region} · {country.incomeLevel} · {indicator.unit}
            </p>
          </div>
          {primary?.isPending && (
            <EconomyLoading label="Loading economic observations" />
          )}
          {primary?.isError && (
            <div className="mb-6">
              <ErrorState
                headingLevel="h2"
                title={
                  primary.data
                    ? 'Economic refresh failed'
                    : 'Economic observations could not load'
                }
                description={`${primary.data ? 'Previously retrieved observations are still shown. ' : ''}${primary.error.message}`}
                onRetry={() => void primary.refetch()}
              />
            </div>
          )}
          {primary?.data && (
            <EconomicMetrics series={primary.data} indicator={indicator} />
          )}
          <Card className="min-w-0 p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Economic indicator trend
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Requested years: {range.from}–{range.to}
                  {selection.period === 'MAX' ? ' · MAX starts at 1960' : ''}
                </p>
              </div>
              <div
                role="group"
                aria-label="Economic period"
                className="flex flex-wrap gap-1"
              >
                {ECONOMIC_PERIODS.map((period) => (
                  <Button
                    key={period}
                    aria-pressed={selection.period === period}
                    className={
                      selection.period === period ? 'bg-soft text-accent' : ''
                    }
                    onClick={() => {
                      setToday(new Date())
                      select({ ...selection, period })
                    }}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            {primary?.isPending && (
              <EconomyLoading label="Loading economic chart" />
            )}
            {primary?.data &&
              (primary.data.latest ? (
                <>
                  <p className="mb-4 text-sm text-muted">
                    Latest observation in this range: {primary.data.latest.year}
                    .{' '}
                    {primary.data.latest.year < range.to
                      ? `No usable observation is available after ${primary.data.latest.year} in this range.`
                      : 'This is annual data, not real-time reporting.'}
                  </p>
                  <EconomicChart
                    country={country}
                    indicator={indicator}
                    series={primary.data}
                    range={range}
                  />
                  {primary.data.updated && (
                    <p className="mt-4 text-xs text-muted">
                      World Bank dataset updated: {primary.data.updated}. This
                      is separate from the observation year.
                    </p>
                  )}
                </>
              ) : (
                <EmptyState
                  title="No observations in this range"
                  description="This country has no usable values for the selected indicator and years. Try a longer range or another indicator. Missing values are not zero."
                />
              ))}
            {primary?.isError && !primary.data && (
              <p className="text-sm text-muted">
                The chart will appear when observations can be retrieved.
              </p>
            )}
          </Card>
          <Card className="mt-6 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">About this indicator</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              {indicator.description}
            </p>
            <p className="mt-2 break-words text-xs text-muted">
              {indicator.code} · {indicator.unit}
            </p>
            {metadata.data && (
              <details className="mt-4">
                <summary className="min-h-11 cursor-pointer text-sm font-medium text-accent">
                  World Bank definition and source
                </summary>
                <h3 className="font-medium">{metadata.data.name}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {metadata.data.description ||
                    'No extended definition supplied.'}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {metadata.data.source}
                </p>
              </details>
            )}
            {metadata.isPending && (
              <p role="status" className="mt-3 text-sm text-muted">
                Loading provider definition…
              </p>
            )}
            {metadata.isError && (
              <div className="mt-3">
                <p role="status" className="mb-3 text-sm text-muted">
                  Provider definition could not refresh. The verified indicator
                  summary remains available.
                </p>
                <Button onClick={() => void metadata.refetch()}>
                  Retry indicator definition
                </Button>
              </div>
            )}
          </Card>
          <EconomicComparison
            countries={countries.data ?? []}
            selection={selection}
            indicator={indicator}
            queries={series}
            onChange={select}
          />
        </>
      )}
      <p className="mt-6 text-xs leading-6 text-muted">
        Source:{' '}
        <a className="text-accent underline" href="https://data.worldbank.org/">
          World Bank — World Development Indicators
        </a>
        . Annual observations may be delayed, missing, or revised. Changes
        describe numerical direction without judging economic performance.
      </p>
    </>
  )
}
