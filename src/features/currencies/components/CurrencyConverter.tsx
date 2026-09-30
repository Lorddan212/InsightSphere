import { useState } from 'react'
import { Card } from '../../../components/ui/Card'
import {
  convertCurrency,
  parseCurrencyAmount,
} from '../utils/currencyCalculations'
import { formatMoney } from '../utils/currencyFormatters'

export function CurrencyConverter({
  base,
  quote,
  rate,
}: {
  base: string
  quote: string
  rate: number | null
}) {
  const [input, setInput] = useState('1000')
  const parsed = parseCurrencyAmount(input)
  const converted = convertCurrency(parsed.value, rate)
  const error =
    parsed.error ??
    (parsed.value !== null && rate !== null && converted === null
      ? 'The converted value is too large to display reliably. Enter a smaller amount.'
      : null)
  return (
    <Card className="mb-6 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">Currency converter</h2>
      <p className="mt-1 text-sm text-muted">
        An estimate at the reference rate. Fees and bank spreads are not
        included.
      </p>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="currency-amount" className="text-sm font-medium">
            Amount in {base}
          </label>
          <input
            id="currency-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={!!error}
            aria-describedby="amount-help amount-error"
            className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-canvas px-3 text-ink"
          />
          <p id="amount-help" className="mt-2 text-xs leading-5 text-muted">
            Use a non-negative decimal, up to 1 trillion and 6 decimal places.
          </p>
          <p
            id="amount-error"
            role={error ? 'alert' : undefined}
            className="mt-1 text-sm text-ink"
          >
            {error}
          </p>
        </div>
        <div className="min-w-0 rounded-lg bg-soft p-4">
          <p className="text-sm text-muted">Converted amount in {quote}</p>
          <output
            htmlFor="currency-amount"
            aria-live="polite"
            className="mt-2 block break-words text-2xl font-semibold tabular-nums"
          >
            {converted === null
              ? parsed.value === null
                ? 'Enter an amount'
                : rate === null
                  ? 'Rate unavailable'
                  : 'Amount out of range'
              : formatMoney(converted, quote)}
          </output>
        </div>
      </div>
    </Card>
  )
}
