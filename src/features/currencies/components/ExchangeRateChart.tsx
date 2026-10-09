import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from '../../../components/ui/States'
import type { ExchangeRatePoint } from '../types/currencies.types'
import { formatCurrencyDate, formatRate } from '../utils/currencyFormatters'

export function ExchangeRateChart({
  points,
  base,
  quote,
}: {
  points: ExchangeRatePoint[]
  base: string
  quote: string
}) {
  const available = points.filter((point) => point.rate !== null)
  if (!available.length)
    return (
      <EmptyState
        title="No historical rates available"
        description="No usable observations were returned for this pair and period. Try a different period or currency."
      />
    )
  const data = points.map((point) => ({
    ...point,
    timestamp: Date.parse(`${point.date}T00:00:00Z`),
  }))
  const axisDate = (timestamp: number) =>
    new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(timestamp)
  return (
    <>
      <p
        id="currency-chart-context"
        className="mb-5 text-sm leading-6 text-muted"
      >
        How has 1 {base} changed in {quote}? {available.length} observations
        from {formatCurrencyDate(available[0].date)} to{' '}
        {formatCurrencyDate(available.at(-1)!.date)}. Only provider observations
        are plotted; lines join available dates, with no added weekend or
        holiday values.
      </p>
      {available.length === 1 && (
        <p className="mb-3 text-sm text-muted">
          Only one observation is available. Period change cannot be calculated.
        </p>
      )}
      {points.some((point) => point.rate === null) && (
        <p className="mb-3 text-sm text-muted">
          Some rates are missing. Gaps are retained and excluded from the
          metrics.
        </p>
      )}
      <div
        aria-describedby="currency-chart-context"
        aria-label={`${base} to ${quote} exchange rate trend`}
        role="img"
        className="h-72 min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={data}
            margin={{ top: 12, right: 18, left: 0, bottom: 8 }}
            accessibilityLayer
          >
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={axisDate}
              minTickGap={32}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <YAxis
              width={72}
              domain={['auto', 'auto']}
              tickFormatter={formatRate}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(label) =>
                typeof label === 'number'
                  ? formatCurrencyDate(
                      new Date(label).toISOString().slice(0, 10),
                    )
                  : ''
              }
              formatter={(value) => [
                typeof value === 'number'
                  ? `${formatRate(value)} ${quote}`
                  : 'Unavailable',
                `1 ${base}`,
              ]}
              contentStyle={{
                background: 'var(--color-panel)',
                borderColor: 'var(--color-line)',
                color: 'var(--color-ink)',
                borderRadius: 8,
              }}
            />
            <Line
              name={quote}
              dataKey="rate"
              type="linear"
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={available.length < 10 ? { r: 3 } : false}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-4 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-accent">
          View historical data table
        </summary>
        <div
          className="max-h-80 overflow-auto"
          role="region"
          aria-label="Scrollable currency observations"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="pb-3 text-left text-muted">
              Actual reference observations. Rate in {quote} for 1 {base}.
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-3">
                  Date (UTC)
                </th>
                <th scope="col" className="py-3 text-right">
                  Rate ({quote})
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.date} className="border-b border-line">
                  <th scope="row" className="py-3 font-normal">
                    {formatCurrencyDate(point.date)}
                  </th>
                  <td className="py-3 text-right">{formatRate(point.rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
