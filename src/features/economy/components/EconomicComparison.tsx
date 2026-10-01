import type { UseQueryResult } from '@tanstack/react-query'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { ErrorState } from '../../../components/ui/States'
import type {
  Country,
  EconomicIndicator,
  EconomicSeries,
  EconomySelection,
} from '../types/economy.types'
import { latestComparableYear } from '../utils/economicCalculations'
import { formatEconomicValue } from '../utils/economicFormatters'

export function EconomicComparison({
  countries,
  selection,
  indicator,
  queries,
  onChange,
}: {
  countries: Country[]
  selection: EconomySelection
  indicator: EconomicIndicator
  queries: UseQueryResult<EconomicSeries, Error>[]
  onChange: (next: EconomySelection) => void
}) {
  const selectedIds = [selection.country, ...selection.comparisons]
  const selected = selectedIds.map((id) =>
    countries.find((country) => country.id === id)!,
  )
  const available = queries.flatMap((query) => (query.data ? [query.data] : []))
  const complete = available.length === selectedIds.length
  const commonYear = complete ? latestComparableYear(available) : null
  return (
    <Card className="mt-6 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Country comparison</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Compare {indicator.name.toLowerCase()} for up to three countries using
        the selected historical range.
      </p>
      <label className="mt-5 block text-sm font-medium">
        Add comparison country
        <select
          value=""
          disabled={selection.comparisons.length >= 2}
          onChange={(event) => {
            if (event.target.value)
              onChange({
                ...selection,
                comparisons: [...selection.comparisons, event.target.value],
              })
          }}
          className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 disabled:opacity-50"
        >
          <option value="">
            {selection.comparisons.length >= 2
              ? 'Comparison limit reached'
              : 'Choose another country'}
          </option>
          {countries
            .filter((country) => !selectedIds.includes(country.id))
            .map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
        </select>
      </label>
      <div className="my-4 flex flex-wrap gap-2">
        {selected.slice(1).map((country) => (
          <Button
            key={country.id}
            aria-label={`Remove ${country.name} from comparison`}
            onClick={() =>
              onChange({
                ...selection,
                comparisons: selection.comparisons.filter(
                  (id) => id !== country.id,
                ),
              })
            }
          >
            {country.name} ×
          </Button>
        ))}
      </div>
      {selection.comparisons.length === 0 ? (
        <p className="text-sm text-muted">
          Add one or two countries to compare the same indicator. The primary
          country is included automatically.
        </p>
      ) : (
        <>
          <p role="status" className="mb-4 rounded-lg bg-soft p-3 text-sm">
            {commonYear !== null
              ? `Latest common observation year: ${commonYear}. Every value below uses this year.`
              : complete
                ? 'No common observation year. Each available latest value is shown with its own year; these are not a same-year comparison.'
                : 'Comparison is incomplete. Available latest observations are shown with their own years while other countries load or recover.'}
          </p>
          {queries.slice(1).map((query, index) =>
            query.isError ? (
              <div className="mb-4" key={selected[index + 1].id}>
                <ErrorState
                  headingLevel="h2"
                  title={`${selected[index + 1].name} comparison could not refresh`}
                  description={`${query.data ? 'Previously retrieved data is still shown. ' : ''}${query.error.message}`}
                  onRetry={() => void query.refetch()}
                />
              </div>
            ) : null,
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm tabular-nums">
              <caption className="pb-3 text-left text-muted">
                {indicator.name} · {indicator.unit}
              </caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-3 pr-3">
                    Country
                  </th>
                  <th scope="col" className="py-3 pr-3">
                    Data year
                  </th>
                  <th scope="col" className="py-3 text-right">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {selected.map((country, index) => {
                  const query = queries[index]
                  const point =
                    commonYear !== null
                      ? query?.data?.observations.find(
                          (item) => item.year === commonYear,
                        )
                      : query?.data?.latest
                  return (
                    <tr key={country.id} className="border-b border-line">
                      <th scope="row" className="py-3 pr-3 font-medium">
                        {country.name}
                      </th>
                      <td className="py-3 pr-3">{point?.year ?? '—'}</td>
                      <td className="py-3 text-right">
                        {query?.isPending ? (
                          <span role="status">Loading {country.name}…</span>
                        ) : (
                          formatEconomicValue(point?.value ?? null, indicator)
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  )
}
