import { useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useLocationSearch } from '../hooks/useLocationSearch'
import type { WeatherLocation } from '../types/weather.types'
import { Button } from '../../../components/ui/Button'

export function LocationSearch({
  onSelect,
}: {
  onSelect: (location: WeatherLocation) => void
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const search = useLocationSearch(input)
  const meaningful = input.trim().length >= 3
  const results = search.settled ? search.data : undefined
  return (
    <section
      aria-label="Choose weather location"
      className="mb-6 rounded-xl border border-line bg-panel p-4 sm:p-5"
    >
      <label htmlFor={id} className="mb-2 block text-sm font-semibold">
        Search for a city or place
      </label>
      <div className="flex items-center gap-2">
        <Search aria-hidden="true" className="size-5 shrink-0 text-muted" />
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={input}
          maxLength={100}
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          onChange={(event) => {
            setInput(event.target.value)
            setOpen(true)
          }}
          placeholder="Try Abuja, London, or Tokyo"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-sm text-ink placeholder:text-muted"
        />
        {input && (
          <Button
            aria-label="Clear location search"
            onClick={() => {
              setInput('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="px-3"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-2 text-xs leading-5 text-muted">
        Enter at least 3 characters. Tab to a result and press Enter to select
        it.
      </p>
      {open && meaningful && (
        <div className="mt-4 border-t border-line pt-3">
          <div role="status" className="text-sm text-muted">
            {search.fetchStatus === 'paused'
              ? 'You are offline. Search will resume when your connection returns.'
              : !search.settled || search.isFetching
                ? 'Searching locations…'
                : search.isError
                  ? ''
                  : results?.length
                    ? `${results.length} locations found`
                    : 'No locations found. Try a different spelling or a nearby city.'}
          </div>
          {search.settled && search.isError && (
            <div role="alert" className="space-y-3">
              <p className="text-sm text-muted">{search.error.message}</p>
              <Button onClick={() => void search.refetch()}>
                Retry location search
              </Button>
            </div>
          )}
          {results && results.length > 0 && (
            <ul
              aria-label="Location results"
              className="mt-2 grid max-h-80 gap-2 overflow-y-auto p-1 sm:grid-cols-2"
            >
              {results.map((location) => (
                <li key={location.id}>
                  <button
                    type="button"
                    className="min-h-20 w-full rounded-lg border border-line p-3 text-left hover:bg-soft"
                    onClick={() => {
                      onSelect(location)
                      setInput('')
                      setOpen(false)
                      inputRef.current?.focus()
                    }}
                  >
                    <span className="block break-words text-sm font-semibold">
                      {location.name}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {[location.region, location.country]
                        .filter(Boolean)
                        .join(', ') || 'Region unavailable'}
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      {location.latitude.toFixed(2)}°,{' '}
                      {location.longitude.toFixed(2)}°
                      {location.timezone ? ` · ${location.timezone}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
