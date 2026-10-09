import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface Point {
  x: number
  label: string
  value: number | null
}
export function MiniTrend({
  title,
  points,
  format,
}: {
  title: string
  points: Point[]
  format: (value: number) => string
}) {
  const valid = points.filter((point) => point.value !== null)
  if (valid.length < 2)
    return (
      <p className="text-sm text-muted">
        Not enough observations for {title.toLowerCase()}.
      </p>
    )
  return (
    <figure aria-label={title}>
      <figcaption className="mb-2 text-xs font-medium text-muted">
        {title}
      </figcaption>
      <div className="h-36" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart
            data={points}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={[points[0].x, points[points.length - 1].x]}
              tickFormatter={(value: number) =>
                points.find((point) => point.x === value)?.label ?? ''
              }
              tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            />
            <YAxis
              width={62}
              domain={['auto', 'auto']}
              tickFormatter={format}
              tick={{ fontSize: 10, fill: 'var(--color-muted)' }}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === 'number' ? format(value) : 'Unavailable'
              }
              labelFormatter={(value) =>
                points.find((point) => point.x === value)?.label ?? ''
              }
              contentStyle={{
                background: 'var(--color-panel)',
                borderColor: 'var(--color-line)',
              }}
            />
            <Line
              dataKey="value"
              name={title}
              stroke="var(--color-accent)"
              strokeWidth={2}
              dot={{ r: 2, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted">
        <summary className="cursor-pointer rounded py-2">
          View trend values
        </summary>
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Observation</th>
                <th scope="col">Value</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.x}>
                  <th scope="row" className="py-1 font-normal">
                    {point.label}
                  </th>
                  <td>
                    {point.value === null ? 'Unavailable' : format(point.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
