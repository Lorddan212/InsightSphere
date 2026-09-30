import { Card } from '../../../components/ui/Card'
import type { ExchangeRatePoint } from '../types/currencies.types'
import { calculateCurrencyMetrics } from '../utils/currencyCalculations'
import {
  formatChange,
  formatCurrencyDate,
  formatRate,
} from '../utils/currencyFormatters'

export function CurrencyMetrics({
  rate,
  points,
  quote,
  period,
  identity,
}: {
  rate: number | null
  points: ExchangeRatePoint[]
  quote: string
  period: string
  identity: boolean
}) {
  const metrics = calculateCurrencyMetrics(points)
  const direction =
    metrics.change === null
      ? 'At least two observations needed'
      : metrics.change > 0
        ? 'Increase'
        : metrics.change < 0
          ? 'Decrease'
          : 'No change'
  const cards = [
    {
      label: identity ? 'Identity rate' : 'Latest reference rate',
      value: formatRate(rate),
      detail: `${quote} per 1 base unit`,
    },
    {
      label: `${period} change`,
      value: formatChange(metrics.percentage),
      detail: `${direction}${metrics.change === null ? '' : ` · ${metrics.change > 0 ? '+' : ''}${formatRate(metrics.change)} ${quote}`}`,
    },
    {
      label: `${period} high`,
      value: formatRate(metrics.high),
      detail: `${metrics.count} available observations`,
    },
    {
      label: `${period} low`,
      value: formatRate(metrics.low),
      detail:
        metrics.first && metrics.last
          ? `${formatCurrencyDate(metrics.first.date)} – ${formatCurrencyDate(metrics.last.date)}`
          : 'No historical observations',
    },
  ]
  return (
    <section
      aria-label="Exchange rate metrics"
      className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <Card key={card.label} className="min-w-0 p-5">
          <h2 className="text-sm text-muted">{card.label}</h2>
          <p className="mt-3 break-words text-2xl font-semibold tabular-nums">
            {card.value}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{card.detail}</p>
        </Card>
      ))}
    </section>
  )
}
