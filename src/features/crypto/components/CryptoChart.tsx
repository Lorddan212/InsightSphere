import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CryptoPeriod, CryptoPricePoint } from '../types/crypto'
import { formatChange, formatPrice, periodChange } from '../utils/crypto'

export function CryptoChart({
  points,
  name,
  period,
}: {
  points: CryptoPricePoint[]
  name: string
  period: CryptoPeriod
}) {
  const date = (value: number, full = false) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      ...(full
        ? { dateStyle: 'medium', timeStyle: 'short' }
        : period === '24H'
          ? { hour: '2-digit', minute: '2-digit' }
          : { month: 'short', day: 'numeric' }),
    }).format(new Date(value))
  const count = points.filter((point) => point.price !== null).length
  return (
    <>
      <p
        id="crypto-chart-context"
        className="mb-4 text-sm leading-6 text-muted"
      >
        {name} price in USD over {period}. {count} available observations. UTC
        timestamps; provider intervals vary by range. Missing prices remain
        gaps. Change between first and last observations:{' '}
        {formatChange(periodChange(points))}.
      </p>
      {count === 1 && (
        <p className="mb-4 text-sm text-muted">
          Only one price observation is available; a trend cannot be
          established.
        </p>
      )}
      <div
        role="img"
        aria-label={`${name} ${period} price trend`}
        aria-describedby="crypto-chart-context"
        className="h-72 min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={points}
            margin={{ top: 12, right: 16, bottom: 8 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value: number) => date(value)}
              minTickGap={40}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <YAxis
              width={95}
              domain={['auto', 'auto']}
              tickFormatter={(value: number) => formatPrice(value)}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <Tooltip
              labelFormatter={(label) =>
                typeof label === 'number' ? `${date(label, true)} UTC` : ''
              }
              formatter={(value) => [
                typeof value === 'number' ? formatPrice(value) : 'Unavailable',
                'Price (USD)',
              ]}
              contentStyle={{
                background: 'var(--color-panel)',
                color: 'var(--color-ink)',
                borderColor: 'var(--color-line)',
                borderRadius: 8,
              }}
            />
            <Line
              dataKey="price"
              name="Price (USD)"
              stroke="var(--color-accent)"
              strokeWidth={2}
              type="linear"
              dot={count === 1}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-4 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-accent">
          View price data table
        </summary>
        <div
          className="max-h-80 overflow-auto"
          tabIndex={0}
          role="region"
          aria-label="Historical price observations"
        >
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="pb-3 text-left text-muted">
              {name} · {period} · USD · Actual provider observations
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-3">
                  Time (UTC)
                </th>
                <th scope="col" className="py-3 text-right">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.timestamp} className="border-b border-line">
                  <th scope="row" className="py-3 font-normal">
                    {date(point.timestamp, true)}
                  </th>
                  <td className="py-3 text-right">
                    {formatPrice(point.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  )
}
