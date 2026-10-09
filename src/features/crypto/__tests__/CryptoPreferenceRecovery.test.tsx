import { expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from '../../../test/server'
import { CryptoSummary } from '../../dashboard/components/CryptoSummary'
import CryptoPage from '../components/CryptoPage'
import { CRYPTO_STORAGE_KEY } from '../hooks/useCryptoPreferences'
import { assetFixture, globalFixture, historyFixture } from './fixtures'

it('recovers an unavailable saved asset to Bitcoin from the overview', async () => {
  sessionStorage.setItem(
    CRYPTO_STORAGE_KEY,
    JSON.stringify({ coinId: 'removed-coin', period: '7D' }),
  )
  server.use(
    http.get('*/api/crypto/global', () => HttpResponse.json(globalFixture)),
    http.get('*/api/crypto/coins/:id', ({ params }) =>
      HttpResponse.json(params.id === 'bitcoin' ? [assetFixture()] : []),
    ),
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CryptoSummary />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  const recovery = await screen.findByRole('button', {
    name: 'Use Bitcoin instead',
  })
  expect(screen.getByText('removed-coin / USD')).toBeInTheDocument()
  recovery.focus()
  await userEvent.keyboard('{Enter}')
  expect(await screen.findByText('$67,450.23')).toBeInTheDocument()
  expect(screen.getByText('Bitcoin · BTC / USD')).toBeInTheDocument()
  expect(sessionStorage.getItem(CRYPTO_STORAGE_KEY)).toContain('bitcoin')
})

it('offers Bitcoin recovery for an unavailable saved asset on the detail landing page', async () => {
  sessionStorage.setItem(
    CRYPTO_STORAGE_KEY,
    JSON.stringify({ coinId: 'removed-coin', period: '7D' }),
  )
  server.use(
    http.get('*/api/crypto/global', () => HttpResponse.json(globalFixture)),
    http.get('*/api/crypto/markets', () => HttpResponse.json([assetFixture()])),
    http.get('*/api/crypto/coins/:id', () => HttpResponse.json([])),
    http.get('*/api/crypto/coins/:id/history', () =>
      HttpResponse.json(historyFixture),
    ),
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CryptoPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  await userEvent.click(
    await screen.findByRole('link', { name: 'Back to Bitcoin overview' }),
  )
  expect(
    await screen.findByRole('img', { name: 'Bitcoin 7D price trend' }),
  ).toBeInTheDocument()
  expect(sessionStorage.getItem(CRYPTO_STORAGE_KEY)).toContain('bitcoin')
})
