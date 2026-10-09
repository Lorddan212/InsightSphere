import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  Country,
  EconomicIndicator,
  EconomicRange,
  EconomicSeries,
} from '../types/economy.types'
import { economicChartPoints } from '../utils/economicCalculations'
import { formatEconomicValue } from '../utils/economicFormatters'

export function EconomicChart({
  country,
  indicator,
  series,
  range,
}: {
  country: Country
  indicator: EconomicIndicator
  series: EconomicSeries
  range: EconomicRange
}) {
  const points = economicChartPoints(series.observations, range)
  const count = points.filter((point) => point.value !== null).length
  return (
    <>
      <p
        id="economy-chart-context"
        className="mb-4 text-sm leading-6 text-muted"
      >
        {indicator.name} in {country.name}, measured in{' '}
        {indicator.unit.toLowerCase()}. {count} of {points.length} requested
        years have observations. Missing years remain gaps, not zero values.
      </p>
      {count === 1 && (
        <p className="mb-4 text-sm text-muted">
          Only one observation is available; a trend or period change cannot be
          established.
        </p>
      )}
      <div
        role="img"
        aria-label={`${country.name} ${indicator.name} historical trend`}
        aria-describedby="economy-chart-context"
        className="h-72 min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={points}
            margin={{ top: 12, left: 0, right: 16, bottom: 8 }}
            accessibilityLayer
          >
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="year"
              type="number"
              domain={[range.from, range.to]}
              allowDecimals={false}
              minTickGap={32}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <YAxis
              width={80}
              domain={['auto', 'auto']}
              tickFormatter={(value) => formatEconomicValue(value, indicator)}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            <Tooltip
              formatter={(value) => [
                typeof value === 'number'
                  ? formatEconomicValue(value, indicator, false)
                  : 'Unavailable',
                indicator.name,
              ]}
              labelFormatter={(label) => `Observation year: ${label}`}
              contentStyle={{
                background: 'var(--color-panel)',
                color: 'var(--color-ink)',
                borderColor: 'var(--color-line)',
                borderRadius: 8,
              }}
            />
            <Line
              dataKey="value"
              name={indicator.name}
              stroke="var(--color-accent)"
              strokeWidth={2}
              type="linear"
              dot={{ r: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-4 border-t border-line pt-4">
        <summary className="min-h-11 cursor-pointer text-sm font-medium text-accent">
          View economic data table
        </summary>
        <div
          className="max-h-80 overflow-auto"
          role="region"
          aria-label="Scrollable economic observations"
          tabIndex={0}
        >
          <table className="w-full text-left text-sm tabular-nums">
            <caption className="pb-3 text-left text-muted">
              {country.name} · {indicator.name} · {indicator.unit}. Unavailable
              years have no usable observation.
            </caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="py-3">
                  Year
                </th>
                <th scope="col" className="py-3 text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr className="border-b border-line" key={point.year}>
                  <th scope="row" className="py-3 font-normal">
                    {point.year}
                  </th>
                  <td className="py-3 text-right">
                    {formatEconomicValue(point.value, indicator, false)}
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
