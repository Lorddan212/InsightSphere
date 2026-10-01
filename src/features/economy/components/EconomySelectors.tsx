import { Card } from '../../../components/ui/Card'
import type { Country, EconomySelection } from '../types/economy.types'
import { ECONOMIC_INDICATORS } from '../utils/economicIndicators'

export function EconomySelectors({
  countries,
  selection,
  onChange,
}: {
  countries: Country[]
  selection: EconomySelection
  onChange: (next: EconomySelection) => void
}) {
  return (
    <Card className="mb-6 grid gap-5 p-5 sm:grid-cols-2">
      <label className="min-w-0 text-sm font-medium">
        Country or economy
        <select
          className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3"
          value={selection.country}
          onChange={(event) =>
            onChange({
              ...selection,
              country: event.target.value,
              comparisons: selection.comparisons.filter(
                (id) => id !== event.target.value,
              ),
            })
          }
        >
          {countries.map((country) => (
            <option value={country.id} key={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-sm font-medium">
        Economic indicator
        <select
          className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3"
          value={selection.indicator}
          onChange={(event) =>
            onChange({ ...selection, indicator: event.target.value })
          }
        >
          {ECONOMIC_INDICATORS.map((indicator) => (
            <option value={indicator.code} key={indicator.code}>
              {indicator.name} — {indicator.unit}
            </option>
          ))}
        </select>
      </label>
    </Card>
  )
}
