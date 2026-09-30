import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState } from '../../../components/ui/States'
import { useWeather } from '../hooks/useWeather'
import { useWeatherLocation } from '../hooks/useWeatherLocation'
import { formatWeatherTime } from '../utils/weatherFormatters'
import { LocationSearch } from './LocationSearch'
import { CurrentWeatherCard } from './CurrentWeatherCard'
import { WeatherMetrics } from './WeatherMetrics'
import { TemperatureChart } from './TemperatureChart'
import { HourlyForecast } from './HourlyForecast'
import { DailyForecast } from './DailyForecast'
import { WeatherPageSkeleton } from './WeatherPageSkeleton'

export default function WeatherPage() {
  const { location, selectLocation } = useWeatherLocation()
  const weather = useWeather(location)
  const data = weather.data
  return (
    <>
      <PageHeader
        title="Weather analytics"
        description="Understand conditions now, and the patterns in the forecast ahead."
        action={
          <Button
            onClick={() => void weather.refetch()}
            disabled={weather.isFetching}
          >
            <RefreshCw aria-hidden="true" size={16} />
            {weather.isFetching ? 'Updating…' : 'Refresh weather'}
          </Button>
        }
      />
      <LocationSearch onSelect={selectLocation} />
      <p className="mb-4 break-words text-sm text-muted" role="status">
        Selected location: {location.name}
        {location.country ? `, ${location.country}` : ''}
      </p>
      {weather.isPending &&
        (weather.fetchStatus === 'paused' ? (
          <ErrorState
            headingLevel="h2"
            title="Waiting for a connection"
            description="You appear to be offline. Weather will load when your connection returns."
            onRetry={() => void weather.refetch()}
          />
        ) : (
          <WeatherPageSkeleton />
        ))}
      {weather.isError && !data && (
        <ErrorState
          headingLevel="h2"
          title="Weather could not load"
          description={weather.error.message}
          onRetry={() => void weather.refetch()}
        />
      )}
      {data && (
        <div className="space-y-6">
          {weather.isError && (
            <div
              role="alert"
              className="rounded-lg border border-line bg-soft p-4 text-sm"
            >
              <p className="font-semibold">
                Refresh failed. Previously retrieved weather is still shown.
              </p>
              <p className="mt-1">{weather.error.message}</p>
            </div>
          )}
          {weather.fetchStatus === 'paused' && (
            <p
              role="status"
              className="rounded-lg border border-line p-4 text-sm"
            >
              Offline. Showing cached data until your connection returns.
            </p>
          )}
          <p className="text-xs leading-6 text-muted" role="status">
            {weather.isFetching
              ? 'Updating forecast… '
              : weather.isStale
                ? 'Cached forecast; an update is recommended. '
                : 'Forecast retrieved. '}
            Last retrieved:{' '}
            {formatWeatherTime(weather.dataUpdatedAt, data.timezone, 'full')} (
            {data.timezone}). Model valid time is shown separately below.
          </p>
          {!data.hasMeasurements ? (
            <EmptyState
              title="Weather measurements unavailable"
              description="The provider returned no usable measurements for this location. Try another place or refresh the forecast."
            />
          ) : (
            <>
              {data.partial && (
                <p
                  role="status"
                  className="rounded-lg border border-line bg-soft/40 p-4 text-sm"
                >
                  Some measurements or forecast periods are unavailable.
                  Available data is shown below; no values have been estimated.
                </p>
              )}
              <CurrentWeatherCard
                data={data}
                location={location}
                retrievedAt={weather.dataUpdatedAt}
              />
              <WeatherMetrics data={data} />
              <TemperatureChart hourly={data.hourly} timezone={data.timezone} />
              <HourlyForecast hourly={data.hourly} timezone={data.timezone} />
              <DailyForecast daily={data.daily} timezone={data.timezone} />
            </>
          )}
        </div>
      )}
      <p className="mt-8 text-xs leading-6 text-muted">
        Weather data by{' '}
        <a className="text-accent underline" href="https://open-meteo.com/">
          Open-Meteo
        </a>
        , under{' '}
        <a
          className="text-accent underline"
          href="https://creativecommons.org/licenses/by/4.0/"
        >
          CC BY 4.0
        </a>
        . Location data by{' '}
        <a className="text-accent underline" href="https://www.geonames.org/">
          GeoNames
        </a>
        . Values are normalized and summary statistics derived by InsightSphere.
      </p>
    </>
  )
}
