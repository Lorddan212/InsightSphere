import { MapPin, Sunrise, Sunset } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { WeatherData, WeatherLocation } from '../types/weather.types'
import {
  formatMeasurement as value,
  formatWeatherTime as time,
  localDateKey,
} from '../utils/weatherFormatters'
import { ConditionIcon } from './ConditionIcon'

export function CurrentWeatherCard({
  data,
  location,
  retrievedAt,
}: {
  data: WeatherData
  location: WeatherLocation
  retrievedAt: number
}) {
  const current = data.current
  const reference = current?.time ?? retrievedAt
  const today = data.daily.find(
    (day) =>
      localDateKey(day.time, data.timezone) ===
      localDateKey(reference, data.timezone),
  )
  return (
    <Card className="grid overflow-hidden md:grid-cols-[1.2fr_1fr]">
      <section aria-labelledby="current-weather-heading" className="p-6 sm:p-8">
        <div className="mb-4 flex items-start gap-2 text-muted">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm break-words">
            {[location.name, location.region, location.country]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
        <h2 id="current-weather-heading" className="text-sm font-semibold">
          Current conditions
        </h2>
        <div className="my-4 flex flex-wrap items-center gap-6">
          <p
            className={
              current?.temperature == null
                ? 'text-2xl font-semibold'
                : 'text-5xl font-semibold tracking-tight sm:text-6xl'
            }
          >
            {value(current?.temperature, 'temperature')}
          </p>
          {current && (
            <ConditionIcon
              category={current.condition.category}
              className="size-12"
            />
          )}
        </div>
        <p className="font-medium">
          {current?.condition.label ?? 'Current conditions unavailable'}
        </p>
        <p className="mt-2 text-sm text-muted">
          Feels like {value(current?.feelsLike, 'temperature')}
        </p>
        <p className="mt-5 text-xs leading-5 text-muted">
          Model valid time: {time(current?.time, data.timezone, 'full')}
          <br />
          Local timezone: {data.timezone}
        </p>
      </section>
      <section
        aria-labelledby="today-heading"
        className="border-t border-line bg-soft/30 p-6 sm:p-8 md:border-l md:border-t-0"
      >
        <h2 id="today-heading" className="mb-5 font-semibold">
          Today’s outlook
        </h2>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-6">
          <div>
            <dt className="text-xs text-muted">High / low</dt>
            <dd className="mt-2 font-semibold">
              {value(today?.high, 'temperature')} /{' '}
              {value(today?.low, 'temperature')}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Max. precipitation chance</dt>
            <dd className="mt-2 font-semibold">
              {value(today?.probability, 'probability')}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs text-muted">
              <Sunrise size={16} aria-hidden="true" />
              Sunrise
            </dt>
            <dd className="mt-2 font-semibold">
              {time(today?.sunrise, data.timezone)}
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-xs text-muted">
              <Sunset size={16} aria-hidden="true" />
              Sunset
            </dt>
            <dd className="mt-2 font-semibold">
              {time(today?.sunset, data.timezone)}
            </dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-5 text-muted">
          Forecasts are model estimates, not station observations. Missing
          values are shown as unavailable.
        </p>
      </section>
    </Card>
  )
}
