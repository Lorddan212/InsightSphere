import { ArrowLeftRight } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import type { Currency, CurrencySelection } from '../types/currencies.types'

export function CurrencySelectors({
  currencies,
  selection,
  onChange,
}: {
  currencies: Currency[]
  selection: CurrencySelection
  onChange: (selection: CurrencySelection) => void
}) {
  return (
    <Card className="mb-6 grid items-end gap-4 p-5 sm:grid-cols-[1fr_auto_1fr]">
      <label className="min-w-0 text-sm font-medium">
        Base currency
        <select
          className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-ink"
          value={selection.base}
          onChange={(event) =>
            onChange({ ...selection, base: event.target.value })
          }
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — {currency.name}
            </option>
          ))}
        </select>
      </label>
      <Button
        aria-label="Swap currencies"
        onClick={() =>
          onChange({
            ...selection,
            base: selection.quote,
            quote: selection.base,
          })
        }
      >
        <ArrowLeftRight aria-hidden="true" size={18} />
      </Button>
      <label className="min-w-0 text-sm font-medium">
        Quote currency
        <select
          className="mt-2 block min-h-11 w-full min-w-0 rounded-lg border border-line bg-canvas px-3 text-ink"
          value={selection.quote}
          onChange={(event) =>
            onChange({ ...selection, quote: event.target.value })
          }
        >
          {currencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — {currency.name}
            </option>
          ))}
        </select>
      </label>
    </Card>
  )
}
