import { useState } from 'react'
import {
  useEconomyCountries,
  useEconomicSeries,
} from '../../economy/hooks/useEconomyQueries'
import { useEconomySelection } from '../../economy/hooks/useEconomySelection'
import {
  DEFAULT_INDICATOR,
  findIndicator,
} from '../../economy/utils/economicIndicators'
import { getEconomicRange } from '../../economy/utils/economicPeriods'
import {
  formatEconomicValue,
  formatEconomicChange,
} from '../../economy/utils/economicFormatters'
import {
  calculateEconomicMetrics,
  economicChartPoints,
} from '../../economy/utils/economicCalculations'
import { MiniTrend } from './MiniTrend'
import { SummaryCard, SummaryValue } from './SummaryCard'

export function EconomySummary() {
  const countries = useEconomyCountries()
  const { selection } = useEconomySelection(countries.data ?? [])
  const [today, setToday] = useState(() => new Date())
  const indicator =
    findIndicator(selection?.indicator ?? '') ?? DEFAULT_INDICATOR
  const range = getEconomicRange(selection?.period ?? '10Y', today)
  const [series] = useEconomicSeries(
    selection ? [selection.country] : [],
    indicator.code,
    range,
  )
  const data = series?.data
  const metrics = calculateEconomicMetrics(data?.observations ?? [], indicator)
  const country = countries.data?.find((item) => item.id === selection?.country)
  function refresh() {
    const now = new Date()
    setToday(now)
    if (!selection || countries.error) void countries.refetch()
    if (getEconomicRange(selection?.period ?? '10Y', now).to === range.to)
      void series?.refetch()
  }
  return (
    <SummaryCard
      id="economy-summary"
      title="Economy"
      context={`${country?.name ?? 'Selected country'} · ${indicator.name}`}
      source="World Bank"
      href="/economy"
      loading={countries.isPending || !!series?.isPending}
      refreshing={countries.isFetching || !!series?.isFetching}
      error={countries.error ?? series?.error ?? null}
      hasData={!!metrics.last}
      onRefresh={refresh}
    >
      <SummaryValue
        label={indicator.unit}
        value={formatEconomicValue(metrics.last?.value ?? null, indicator)}
      />
      <p className="text-sm text-muted">
        {metrics.last
          ? `Latest observation: ${metrics.last.year}. Annual published data; not real-time.`
          : 'No observations available for this selection.'}
      </p>
      <p className="text-sm text-muted">
        Period change: {formatEconomicChange(metrics.change, indicator)}
        {metrics.first && metrics.last
          ? ` · ${metrics.first.year}–${metrics.last.year}`
          : ''}
      </p>
      <MiniTrend
        title={`Annual trend · ${indicator.unit}`}
        points={economicChartPoints(data?.observations ?? [], range).map(
          (point) => ({
            x: point.year,
            label: String(point.year),
            value: point.value,
          }),
        )}
        format={(value) => formatEconomicValue(value, indicator)}
      />
      <p className="text-xs text-muted">
        {data?.updated
          ? `Provider dataset updated: ${data.updated}.`
          : 'Dataset update date unavailable.'}{' '}
        Missing years remain gaps.
      </p>
    </SummaryCard>
  )
}
