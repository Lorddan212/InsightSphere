import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/States'
import type { HourlyWeather } from '../types/weather.types'
import {
  formatMeasurement as value,
  formatWeatherTime as time,
} from '../utils/weatherFormatters'
import { weatherInsights } from '../utils/weatherInsights'

export function TemperatureChart({
  hourly,
  timezone,
}: {
  hourly: HourlyWeather[]
  timezone: string
}) {
  const insight = weatherInsights(hourly)
  return (
    <Card className="min-w-0 p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Temperature outlook</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        How does temperature change across the next 24 forecast hours? All times
        are local to {timezone}. Gaps indicate missing measurements.
      </p>
      {insight.low === null ? (
        <EmptyState
          title="Temperature forecast unavailable"
          description="The provider did not return temperature measurements for this window."
        />
      ) : (
        <>
          <p className="mt-3 text-sm font-medium">
            Available range: {value(insight.low, 'temperature')} to{' '}
            {value(insight.high, 'temperature')}
          </p>
          <div
            className="mt-5 h-64 w-full min-w-0 sm:h-72"
            role="img"
            aria-label={`Temperature forecast, ranging from ${value(insight.low, 'temperature')} to ${value(insight.high, 'temperature')}. Full data is available in the hourly table below.`}
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart
                data={hourly}
                margin={{ top: 12, right: 16, bottom: 8, left: 0 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis
                  dataKey="time"
                  tickFormatter={(timestamp: number) =>
                    time(timestamp, timezone)
                  }
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  minTickGap={40}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  width={48}
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  tickFormatter={(temperature: number) => `${temperature}°`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip
                  labelFormatter={(timestamp) =>
                    time(Number(timestamp), timezone, 'full')
                  }
                  formatter={(temperature) => [
                    value(
                      typeof temperature === 'number' ? temperature : null,
                      'temperature',
                    ),
                    'Temperature',
                  ]}
                  contentStyle={{
                    background: 'var(--panel)',
                    borderColor: 'var(--line)',
                    borderRadius: 8,
                    color: 'var(--ink)',
                  }}
                  labelStyle={{ color: 'var(--ink)' }}
                />
                <Line
                  name="Temperature"
                  type="linear"
                  dataKey="temperature"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={
                    hourly.filter((point) => point.temperature !== null)
                      .length === 1
                  }
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Card>
  )
}
