import { Droplets, Gauge, Umbrella, Wind } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { WeatherData } from '../types/weather.types'
import {
  formatMeasurement as value,
  windDirection,
} from '../utils/weatherFormatters'
import { weatherInsights } from '../utils/weatherInsights'

export function WeatherMetrics({ data }: { data: WeatherData }) {
  const current = data.current
  const insight = weatherInsights(data.hourly)
  const metrics = [
    {
      title: 'Relative humidity',
      icon: Droplets,
      metric: value(current?.humidity, 'humidity'),
      detail: `Forecast range: ${value(insight.humidityLow, 'humidity')} – ${value(insight.humidityHigh, 'humidity')}`,
    },
    {
      title: 'Wind speed',
      icon: Wind,
      metric: value(current?.wind, 'wind'),
      detail: `${windDirection(current?.direction ?? null)} · Gusts ${value(current?.gust, 'wind')}. Forecast peak: ${value(insight.maxWind, 'wind')}`,
    },
    {
      title: 'Precipitation',
      icon: Umbrella,
      metric: value(current?.precipitation, 'precipitation'),
      detail: `${current?.interval ? `Previous ${current.interval / 60} minutes` : 'Current interval unavailable'}. Forecast total: ${value(insight.precipitationTotal, 'precipitation')}`,
    },
    {
      title: 'Surface pressure',
      icon: Gauge,
      metric: value(current?.pressure, 'pressure'),
      detail:
        'At the selected location’s elevation; not adjusted to sea level.',
    },
  ]
  return (
    <section aria-label="Weather metrics">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ title, icon: Icon, metric, detail }) => (
          <Card key={title} className="p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-muted">{title}</h2>
              <Icon
                aria-hidden="true"
                className="size-5 shrink-0 text-accent"
              />
            </div>
            <p className="text-2xl font-semibold">{metric}</p>
            <p className="mt-3 text-xs leading-5 text-muted">{detail}</p>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        Forecast statistics use the displayed hourly window. Ranges and peaks
        use available measurements; incomplete totals are unavailable.
      </p>
    </section>
  )
}
