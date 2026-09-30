import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/States'
import type { HourlyWeather } from '../types/weather.types'
import {
  formatMeasurement as value,
  formatWeatherTime as time,
} from '../utils/weatherFormatters'
import { ConditionIcon } from './ConditionIcon'

export function HourlyForecast({
  hourly,
  timezone,
}: {
  hourly: HourlyWeather[]
  timezone: string
}) {
  return (
    <Card className="min-w-0 p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Hourly forecast</h2>
      <p className="mt-2 text-sm text-muted">
        Next {hourly.length} forecast hours · {timezone}
      </p>
      {hourly.length === 0 ? (
        <EmptyState
          title="Hourly data unavailable"
          description="Other available weather sections remain visible. Try refreshing the forecast."
        />
      ) : (
        <>
          <div
            tabIndex={0}
            role="region"
            aria-label="Scrollable hourly forecast"
            className="mt-5 overflow-x-auto rounded-lg pb-3"
          >
            <ul className="flex min-w-max gap-3">
              {hourly.map((point) => (
                <li
                  key={point.time}
                  className="w-32 shrink-0 rounded-lg border border-line bg-canvas/50 p-4"
                >
                  <p className="text-xs text-muted">
                    {time(point.time, timezone, 'day')}
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {time(point.time, timezone)}
                  </p>
                  <div className="my-3">
                    <ConditionIcon category={point.condition.category} />
                  </div>
                  <p className="text-lg font-semibold">
                    {value(point.temperature, 'temperature')}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    {point.condition.label}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    Rain chance
                    <br />
                    {value(point.probability, 'probability')}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <details className="mt-4 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-accent">
              View hourly measurements as a table
            </summary>
            <div
              role="region"
              tabIndex={0}
              aria-label="Scrollable hourly measurements"
              className="mt-4 overflow-x-auto"
            >
              <table className="w-full min-w-[660px] text-left text-sm">
                <caption className="mb-3 text-left text-xs text-muted">
                  Local forecast times in {timezone}. Precipitation amounts
                  cover the preceding hour.
                </caption>
                <thead>
                  <tr>
                    {[
                      'Local time',
                      'Temperature',
                      'Humidity',
                      'Rain chance',
                      'Precipitation',
                      'Wind',
                    ].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="border-b border-line px-3 py-3 font-medium"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hourly.map((point) => (
                    <tr key={point.time}>
                      <th
                        scope="row"
                        className="border-b border-line px-3 py-3 font-normal"
                      >
                        {time(point.time, timezone, 'full')}
                      </th>
                      {[
                        value(point.temperature, 'temperature'),
                        value(point.humidity, 'humidity'),
                        value(point.probability, 'probability'),
                        value(point.precipitation, 'precipitation'),
                        value(point.wind, 'wind'),
                      ].map((measurement, i) => (
                        <td key={i} className="border-b border-line px-3 py-3">
                          {measurement}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </Card>
  )
}
