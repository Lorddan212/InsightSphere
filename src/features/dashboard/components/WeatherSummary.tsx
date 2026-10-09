import { useWeatherLocation } from '../../weather/hooks/useWeatherLocation'
import { useWeather } from '../../weather/hooks/useWeather'
import {
  formatMeasurement,
  formatWeatherTime,
} from '../../weather/utils/weatherFormatters'
import { MiniTrend } from './MiniTrend'
import { SummaryCard, SummaryValue } from './SummaryCard'

export function WeatherSummary() {
  const { location } = useWeatherLocation()
  const query = useWeather(location)
  const data = query.data
  return (
    <SummaryCard
      id="weather-summary"
      title="Weather"
      context={`${location.name}, ${location.country}`}
      source="Open-Meteo"
      href="/weather"
      loading={query.isPending}
      refreshing={query.isFetching}
      error={query.error}
      hasData={!!data?.hasMeasurements}
      onRefresh={() => void query.refetch()}
    >
      <SummaryValue
        label="Current temperature"
        value={formatMeasurement(data?.current?.temperature, 'temperature')}
      />
      {data?.current && (
        <p className="text-sm text-muted">
          {data.current.condition.label} · Feels like{' '}
          {formatMeasurement(data.current.feelsLike, 'temperature')}
        </p>
      )}
      {data?.partial && (
        <p className="text-sm text-muted">
          Some weather measurements are unavailable.
        </p>
      )}
      {data?.hasMeasurements ? (
        <MiniTrend
          title="Next 24 hours · °C"
          points={data.hourly.slice(0, 24).map((point) => ({
            x: point.time,
            label: formatWeatherTime(point.time, data.timezone, 'full'),
            value: point.temperature,
          }))}
          format={(value) => formatMeasurement(value, 'temperature')}
        />
      ) : (
        <p className="text-sm text-muted">No weather measurements available.</p>
      )}
      <p className="text-xs text-muted">
        {data?.current
          ? `Observation: ${formatWeatherTime(data.current.time, data.timezone, 'full')} (${data.timezone})`
          : 'Current observation time unavailable.'}
      </p>
    </SummaryCard>
  )
}
