import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { EmptyState, ErrorState } from '../../../components/ui/States'
import {
  useCurrencies,
  useHistoricalRates,
  useLatestRate,
} from '../hooks/useCurrencyQueries'
import { useCurrencySelection } from '../hooks/useCurrencySelection'
import {
  CURRENCY_PERIODS,
  getCurrencyDateRange,
} from '../utils/currencyPeriods'
import { formatCurrencyDate, formatRate } from '../utils/currencyFormatters'
import { CurrencySelectors } from './CurrencySelectors'
import { CurrencyConverter } from './CurrencyConverter'
import { CurrencyMetrics } from './CurrencyMetrics'
import { ExchangeRateChart } from './ExchangeRateChart'

function CurrencyLoading({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="my-4 rounded-xl border border-line p-5"
    >
      <span className="text-sm text-muted">{label}…</span>
      <div
        aria-hidden="true"
        className="mt-4 h-24 animate-pulse rounded-lg bg-line"
      />
    </div>
  )
}

export default function CurrencyPage() {
  const currencies = useCurrencies()
  const { selection, select } = useCurrencySelection(currencies.data ?? [])
  const [today, setToday] = useState(() => new Date())
  const range = getCurrencyDateRange(selection?.period ?? '1M', today)
  const latest = useLatestRate(selection)
  const history = useHistoricalRates(selection, range)
  const identity = !!selection && selection.base === selection.quote
  const rate = identity ? 1 : (latest.data?.rate ?? null)
  const refreshing =
    currencies.isFetching ||
    (!identity && (latest.isFetching || history.isFetching))

  function refresh() {
    const now = new Date()
    const updatedRange = getCurrencyDateRange(selection?.period ?? '1M', now)
    setToday(now)
    void currencies.refetch()
    if (selection && !identity) {
      void latest.refetch()
      if (range.to === updatedRange.to) void history.refetch()
    }
  }
  return (
    <>
      <PageHeader
        title="Currency Analytics"
        description="Follow reference exchange rates, convert amounts, and explore how a currency pair changes over time."
        action={
          <Button onClick={refresh} disabled={refreshing}>
            <RefreshCw aria-hidden="true" size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh currencies'}
          </Button>
        }
      />
      {currencies.isPending && <CurrencyLoading label="Loading currencies" />}
      {currencies.isError && !currencies.data && (
        <ErrorState
          headingLevel="h2"
          title="Currencies could not load"
          description={currencies.error.message}
          onRetry={() => void currencies.refetch()}
        />
      )}
      {currencies.data?.length === 0 && (
        <EmptyState
          title="No supported currencies available"
          description="The provider returned an empty currency list. Please try refreshing later."
        />
      )}
      {currencies.isError && currencies.data && (
        <p role="status" className="mb-4 text-sm text-muted">
          Currency list refresh failed. Previously retrieved choices are still
          shown.
        </p>
      )}
      {selection && (
        <>
          <CurrencySelectors
            currencies={currencies.data ?? []}
            selection={selection}
            onChange={select}
          />
          <div className="mb-6 rounded-xl bg-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              {identity
                ? 'Same-currency conversion'
                : 'Latest published reference'}
            </p>
            <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
              {rate === null
                ? `${selection.base} / ${selection.quote} · Rate unavailable`
                : `1 ${selection.base} = ${formatRate(rate)} ${selection.quote}`}
            </p>
            <p className="mt-2 text-sm text-muted">
              {identity
                ? 'Identity rate: no exchange is needed. No provider rate or history is requested.'
                : latest.data
                  ? `Provider date: ${formatCurrencyDate(latest.data.date)}. Reference data, not real-time pricing.`
                  : 'Awaiting a published reference rate.'}
            </p>
          </div>
          {!identity && latest.isPending && (
            <CurrencyLoading label="Loading latest rate" />
          )}
          {!identity && latest.isError && (
            <ErrorState
              headingLevel="h2"
              title={
                latest.data
                  ? 'Latest rate refresh failed'
                  : 'Latest rate could not load'
              }
              description={
                latest.data
                  ? 'Previously retrieved rate is still shown. ' +
                    latest.error.message
                  : latest.error.message
              }
              onRetry={() => void latest.refetch()}
            />
          )}
          {!identity && latest.data && rate === null && (
            <p role="status" className="my-4 text-sm text-muted">
              The latest observation has no usable rate. Conversion is
              unavailable; historical analysis may still be available.
            </p>
          )}
          <CurrencyMetrics
            rate={rate}
            points={identity ? [] : (history.data ?? [])}
            quote={selection.quote}
            period={selection.period}
            identity={identity}
          />
          <CurrencyConverter
            base={selection.base}
            quote={selection.quote}
            rate={rate}
          />
          <Card className="min-w-0 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Exchange rate trend</h2>
                <p className="mt-1 text-sm text-muted">
                  {selection.base} / {selection.quote} ·{' '}
                  {formatCurrencyDate(range.from)} –{' '}
                  {formatCurrencyDate(range.to)}
                </p>
              </div>
              <div
                role="group"
                aria-label="Historical period"
                className="flex flex-wrap gap-1"
              >
                {CURRENCY_PERIODS.map((period) => (
                  <Button
                    key={period}
                    aria-pressed={selection.period === period}
                    onClick={() => {
                      setToday(new Date())
                      select({ ...selection, period })
                    }}
                    className={
                      selection.period === period ? 'bg-soft text-accent' : ''
                    }
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
            {identity ? (
              <EmptyState
                title="No exchange-rate movement"
                description="A currency equals itself. Choose two different currencies to explore published history."
              />
            ) : (
              <>
                {history.isPending && (
                  <CurrencyLoading label="Loading historical rates" />
                )}
                {history.isError && (
                  <ErrorState
                    headingLevel="h2"
                    title={
                      history.data
                        ? 'History refresh failed'
                        : 'History could not load'
                    }
                    description={
                      history.data
                        ? 'Previously retrieved history is still shown. ' +
                          history.error.message
                        : history.error.message
                    }
                    onRetry={() => void history.refetch()}
                  />
                )}
                {history.data && (
                  <ExchangeRateChart
                    points={history.data}
                    base={selection.base}
                    quote={selection.quote}
                  />
                )}
              </>
            )}
          </Card>
        </>
      )}
      <p className="mt-6 text-xs leading-6 text-muted">
        Source:{' '}
        <a href="https://frankfurter.dev/" className="text-accent underline">
          Frankfurter
        </a>
        , using blended reference rates. Publication dates and historical
        coverage vary by currency. Period change compares the first and last
        available observations, not necessarily the range endpoints. Values are
        estimates, not financial advice.
      </p>
    </>
  )
}
