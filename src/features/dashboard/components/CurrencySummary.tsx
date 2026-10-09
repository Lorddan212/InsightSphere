import { useState } from 'react'
import {
  useCurrencies,
  useHistoricalRates,
  useLatestRate,
} from '../../currencies/hooks/useCurrencyQueries'
import { useCurrencySelection } from '../../currencies/hooks/useCurrencySelection'
import { getCurrencyDateRange } from '../../currencies/utils/currencyPeriods'
import {
  formatRate,
  formatCurrencyDate,
  formatChange,
} from '../../currencies/utils/currencyFormatters'
import { calculateCurrencyMetrics } from '../../currencies/utils/currencyCalculations'
import { MiniTrend } from './MiniTrend'
import { SummaryCard, SummaryValue } from './SummaryCard'

export function CurrencySummary() {
  const supported = useCurrencies()
  const { selection } = useCurrencySelection(supported.data ?? [])
  const [today, setToday] = useState(() => new Date())
  const range = getCurrencyDateRange(selection?.period ?? '1M', today)
  const latest = useLatestRate(selection)
  const history = useHistoricalRates(selection, range)
  const identity = !!selection && selection.base === selection.quote
  const metrics = calculateCurrencyMetrics(history.data ?? [])
  const error = supported.error ?? latest.error ?? history.error
  function refresh() {
    const now = new Date()
    setToday(now)
    if (!selection || supported.error) void supported.refetch()
    if (selection && !identity) {
      void latest.refetch()
      if (getCurrencyDateRange(selection.period, now).to === range.to)
        void history.refetch()
    }
  }
  return (
    <SummaryCard
      id="currency-summary"
      title="Currencies"
      context={
        selection
          ? `${selection.base} → ${selection.quote} · ${selection.period}`
          : 'Selected exchange-rate pair'
      }
      source="Frankfurter"
      href="/currencies"
      loading={
        supported.isPending ||
        (!!selection && !identity && latest.isPending && history.isPending)
      }
      refreshing={
        supported.isFetching || latest.isFetching || history.isFetching
      }
      error={error}
      hasData={identity || !!latest.data || !!history.data?.length}
      onRefresh={refresh}
    >
      <SummaryValue
        label={
          selection
            ? `1 ${selection.base} in ${selection.quote}`
            : 'Reference exchange rate'
        }
        value={identity ? '1' : formatRate(latest.data?.rate ?? null)}
      />
      {identity ? (
        <p className="text-sm text-muted">
          Same-currency identity rate. No market history applies.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted">
            Period change: {formatChange(metrics.percentage)}
            {metrics.first && metrics.last
              ? ` · ${formatCurrencyDate(metrics.first.date)}–${formatCurrencyDate(metrics.last.date)}`
              : ''}
          </p>
          <MiniTrend
            title={`Reference rate · ${selection?.quote ?? ''} per ${selection?.base ?? ''}`}
            points={(history.data ?? []).map((point) => ({
              x: Date.parse(point.date),
              label: formatCurrencyDate(point.date),
              value: point.rate,
            }))}
            format={formatRate}
          />
        </>
      )}
      <p className="text-xs text-muted">
        {identity
          ? 'Identity rate; no provider date.'
          : latest.data
            ? `Reference date: ${formatCurrencyDate(latest.data.date)}. Published reference rate, not a streaming quote.`
            : 'Reference date unavailable.'}
      </p>
      {!selection && !supported.isPending && !supported.error && (
        <p className="text-sm text-muted">No supported currencies available.</p>
      )}
    </SummaryCard>
  )
}
