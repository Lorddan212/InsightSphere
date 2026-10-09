import { useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Link } from 'react-router'
import type { CryptoAsset } from '../types/crypto'
import { formatCompact, formatPrice, formatUpdated } from '../utils/crypto'
import { Change } from './CryptoMetrics'
import {
  sortAssets,
  type AssetSortKey,
  type SortDirection,
} from '../utils/sortAssets'

const columns: { key: AssetSortKey; label: string }[] = [
  { key: 'rank', label: 'Rank' },
  { key: 'price', label: 'Price' },
  { key: 'change24h', label: '24h change' },
  { key: 'marketCap', label: 'Market cap' },
  { key: 'volume', label: '24h volume' },
]

export function CryptoMarketTable({
  assets,
  selectedId,
  onSelect,
}: {
  assets: CryptoAsset[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState<{
    key: AssetSortKey
    direction: SortDirection
  }>({ key: 'rank', direction: 'ascending' })
  const rows = sortAssets(assets, sort.key, sort.direction).filter((asset) =>
    `${asset.name} ${asset.symbol} ${asset.id}`
      .toLowerCase()
      .includes(filter.trim().toLowerCase()),
  )
  function heading(key: AssetSortKey, label: string) {
    const active = sort.key === key
    const direction =
      active && sort.direction === 'ascending' ? 'descending' : 'ascending'
    const Icon = active
      ? sort.direction === 'ascending'
        ? ArrowUp
        : ArrowDown
      : ArrowUpDown
    return (
      <th
        key={key}
        scope="col"
        aria-sort={active ? sort.direction : undefined}
        className="px-4 py-1 text-right"
      >
        <button
          type="button"
          onClick={() => setSort({ key, direction })}
          aria-label={`Sort by ${label.toLowerCase()}, ${direction}`}
          className="ml-auto flex min-h-11 items-center gap-1 rounded font-semibold"
        >
          {label}
          <Icon size={14} aria-hidden="true" />
        </button>
      </th>
    )
  }
  return (
    <section aria-labelledby="market-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="market-heading" className="text-lg font-semibold">
            Market leaders
          </h2>
          <p className="mt-1 text-sm text-muted">
            Up to 50 assets by market cap · USD · Select an asset to explore.
          </p>
        </div>
        <label className="text-sm">
          Filter these assets
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-panel px-3 sm:w-64"
          />
        </label>
      </div>
      <p role="status" className="mb-3 text-xs text-muted">
        {rows.length} of {assets.length} assets · Sorted by{' '}
        {columns.find((column) => column.key === sort.key)?.label.toLowerCase()}
        , {sort.direction}. Missing values appear last.
      </p>
      <div
        className="overflow-x-auto rounded-xl border border-line bg-panel"
        role="region"
        aria-label="Scrollable market table"
        tabIndex={0}
      >
        <table className="w-full min-w-[740px] text-left text-sm tabular-nums">
          <caption className="sr-only">
            Cryptocurrency market rankings, prices and 24-hour activity in USD
          </caption>
          <thead className="border-b border-line text-xs text-muted">
            <tr>
              {heading('rank', 'Rank')}
              <th scope="col" className="px-4 py-4">
                Asset
              </th>
              {columns.slice(1).map(({ key, label }) => heading(key, label))}
            </tr>
          </thead>
          <tbody>
            {rows.map((asset) => (
              <tr
                key={asset.id}
                className={`border-b border-line last:border-0 ${selectedId === asset.id ? 'bg-soft' : ''}`}
              >
                <td className="px-4 py-4 text-right">{asset.rank ?? '—'}</td>
                <th scope="row" className="px-4 py-2 font-medium">
                  <Link
                    to={`/crypto/${asset.id}`}
                    onClick={() => onSelect(asset.id)}
                    aria-current={selectedId === asset.id ? 'true' : undefined}
                    className="flex min-h-11 items-center gap-3 text-accent"
                  >
                    {asset.image && (
                      <img
                        src={asset.image}
                        alt=""
                        width={28}
                        height={28}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true
                        }}
                        className="size-7 shrink-0"
                      />
                    )}
                    <span className="max-w-52 break-words">
                      {asset.name}{' '}
                      <span className="ml-2 text-xs text-muted">
                        {asset.symbol}
                      </span>
                    </span>
                  </Link>
                  <span className="block text-xs font-normal text-muted">
                    {formatUpdated(asset.updatedAt)}
                  </span>
                </th>
                <td className="px-4 py-4 text-right">
                  {formatPrice(asset.price)}
                </td>
                <td className="px-4 py-4 text-right">
                  <Change value={asset.change24h} />
                </td>
                <td className="px-4 py-4 text-right">
                  {formatCompact(asset.marketCap)}
                </td>
                <td className="px-4 py-4 text-right">
                  {formatCompact(asset.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="p-6 text-sm text-muted">
            {assets.length
              ? 'No assets match this filter.'
              : 'No market assets are available.'}
          </p>
        )}
      </div>
    </section>
  )
}
