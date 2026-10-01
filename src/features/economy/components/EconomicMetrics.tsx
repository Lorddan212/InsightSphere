import { Card } from '../../../components/ui/Card'
import type { EconomicIndicator, EconomicSeries } from '../types/economy.types'
import { calculateEconomicMetrics } from '../utils/economicCalculations'
import {
  formatEconomicChange,
  formatEconomicValue,
} from '../utils/economicFormatters'

export function EconomicMetrics({
  series,
  indicator,
}: {
  series: EconomicSeries
  indicator: EconomicIndicator
}) {
  const metrics = calculateEconomicMetrics(series.observations, indicator)
  const period =
    metrics.first && metrics.last
      ? `${metrics.first.year}–${metrics.last.year}`
      : 'No available observations'
  const cards = [
    {
      title: 'Latest available value',
      value: formatEconomicValue(metrics.last?.value ?? null, indicator),
      detail: metrics.last
        ? `Data year: ${metrics.last.year} · within selected range`
        : 'No data in selected range',
    },
    {
      title: 'Period change',
      value: formatEconomicChange(metrics.change, indicator),
      detail:
        metrics.count < 2
          ? 'At least two observations needed'
          : `${period}${indicator.change === 'relative' && metrics.difference !== null ? ` · ${formatEconomicValue(metrics.difference, indicator)} absolute change` : ''}`,
    },
    {
      title: 'Period high',
      value: formatEconomicValue(metrics.high, indicator),
      detail: `${metrics.count} available observations`,
    },
    {
      title: 'Period low',
      value: formatEconomicValue(metrics.low, indicator),
      detail: period,
    },
  ]
  return (
    <section
      aria-label="Economic metrics"
      className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <Card key={card.title} className="min-w-0 p-5">
          <h3 className="text-sm text-muted">{card.title}</h3>
          <p className="mt-3 break-words text-2xl font-semibold tabular-nums">
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{card.detail}</p>
        </Card>
      ))}
    </section>
  )
}
