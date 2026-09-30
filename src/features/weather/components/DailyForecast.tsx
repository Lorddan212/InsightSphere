import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/States'
import type { DailyWeather } from '../types/weather.types'
import {
  formatMeasurement as value,
  formatWeatherTime as time,
} from '../utils/weatherFormatters'
import { ConditionIcon } from './ConditionIcon'

export function DailyForecast({
  daily,
  timezone,
}: {
  daily: DailyWeather[]
  timezone: string
}) {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold">7-day forecast</h2>
      <p className="mt-2 text-sm text-muted">
        Daily outlook in {timezone}. Rain chance is the day’s maximum.
      </p>
      {daily.length === 0 ? (
        <EmptyState
          title="Daily forecast unavailable"
          description="The provider has not returned a daily forecast. You can still explore other available measurements."
        />
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {daily.map((day) => (
            <li
              key={day.time}
              className="grid gap-4 py-5 sm:grid-cols-[1.1fr_1fr_1.2fr]"
            >
              <div>
                <p className="font-semibold">
                  {time(day.time, timezone, 'day')}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ConditionIcon
                    category={day.condition.category}
                    className="size-5 shrink-0"
                  />
                  <span className="text-sm text-muted">
                    {day.condition.label}
                  </span>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">High</dt>
                  <dd className="mt-1 font-semibold">
                    {value(day.high, 'temperature')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Low</dt>
                  <dd className="mt-1">{value(day.low, 'temperature')}</dd>
                </div>
              </dl>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted">Rain chance</dt>
                  <dd className="mt-1">
                    {value(day.probability, 'probability')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Rain / snow</dt>
                  <dd className="mt-1">
                    {value(day.precipitation, 'precipitation')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Max. wind</dt>
                  <dd className="mt-1">{value(day.wind, 'wind')}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
