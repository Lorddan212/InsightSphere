import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { CryptoMarketTable } from '../components/CryptoMarketTable'
import { sortAssets, type AssetSortKey } from '../utils/sortAssets'
import { normalizeAsset } from '../utils/crypto'
import { assetFixture } from './fixtures'

const assets = [
  {
    ...normalizeAsset(assetFixture()),
    id: 'alpha',
    name: 'Alpha',
    symbol: 'AAA',
    rank: 1,
    price: 10,
    change24h: -3,
    marketCap: 100,
    volume: 10,
  },
  {
    ...normalizeAsset(assetFixture()),
    id: 'beta',
    name: 'Beta',
    symbol: 'BBB',
    rank: 2,
    price: null,
    change24h: null,
    marketCap: null,
    volume: null,
  },
  {
    ...normalizeAsset(assetFixture()),
    id: 'gamma',
    name: 'Gamma',
    symbol: 'GGG',
    rank: 3,
    price: 5,
    change24h: 2,
    marketCap: 50,
    volume: 20,
  },
]
function mount() {
  const onSelect = vi.fn()
  render(
    <MemoryRouter>
      <CryptoMarketTable
        assets={assets}
        selectedId="alpha"
        onSelect={onSelect}
      />
    </MemoryRouter>,
  )
  return onSelect
}
const rowNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getByRole('link').textContent?.trim())

describe('Crypto table sorting', () => {
  it('sorts through keyboard headers, exposes direction and keeps missing values last', async () => {
    const user = userEvent.setup()
    mount()
    expect(screen.getByRole('columnheader', { name: 'Rank' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    screen.getByRole('button', { name: 'Sort by price, ascending' }).focus()
    await user.keyboard('{Enter}')
    expect(rowNames()).toEqual(['Gamma GGG', 'Alpha AAA', 'Beta BBB'])
    expect(screen.getByRole('columnheader', { name: 'Price' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await user.keyboard('{Enter}')
    expect(rowNames()).toEqual(['Alpha AAA', 'Gamma GGG', 'Beta BBB'])
    expect(screen.getByRole('columnheader', { name: 'Price' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    expect(
      screen.getByRole('columnheader', { name: 'Rank' }),
    ).not.toHaveAttribute('aria-sort')
  })
  it('combines sorting and filtering and restores the sorted list when cleared', async () => {
    const user = userEvent.setup()
    mount()
    await user.click(
      screen.getByRole('button', { name: 'Sort by 24h volume, ascending' }),
    )
    await user.type(screen.getByRole('searchbox'), 'ggg')
    expect(rowNames()).toEqual(['Gamma GGG'])
    expect(screen.getByRole('status')).toHaveTextContent('1 of 3 assets')
    await user.clear(screen.getByRole('searchbox'))
    expect(rowNames()).toEqual(['Alpha AAA', 'Gamma GGG', 'Beta BBB'])
    await user.type(screen.getByRole('searchbox'), 'no-match')
    expect(screen.getByText('No assets match this filter.')).toBeInTheDocument()
  })
  it('preserves selected asset links and keyboard selection after sorting', async () => {
    const user = userEvent.setup()
    const select = mount()
    await user.click(
      screen.getByRole('button', { name: 'Sort by market cap, ascending' }),
    )
    expect(screen.getByRole('link', { name: 'Alpha AAA' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    const link = screen.getByRole('link', { name: 'Gamma GGG' })
    expect(link).toHaveAttribute('href', '/crypto/gamma')
    link.focus()
    await user.keyboard('{Enter}')
    expect(select).toHaveBeenCalledWith('gamma')
    expect(
      screen.getByRole('region', { name: 'Scrollable market table' }),
    ).toHaveAttribute('tabindex', '0')
  })
  it.each([
    'rank',
    'price',
    'change24h',
    'marketCap',
    'volume',
  ] as AssetSortKey[])(
    'orders %s stably without mutating query data',
    (key) => {
      const source = [
        { ...assets[0], [key]: 2 },
        { ...assets[1], [key]: null },
        { ...assets[2], [key]: 2 },
        { ...assets[0], id: 'low', [key]: -1 },
      ]
      const before = structuredClone(source)
      expect(
        sortAssets(source, key, 'ascending').map((item) => item.id),
      ).toEqual(['low', 'alpha', 'gamma', 'beta'])
      expect(
        sortAssets(source, key, 'descending').map((item) => item.id),
      ).toEqual(['alpha', 'gamma', 'low', 'beta'])
      expect(source).toEqual(before)
    },
  )
})
