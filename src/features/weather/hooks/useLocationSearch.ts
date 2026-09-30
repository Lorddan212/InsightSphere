import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchLocations } from '../api/geocoding.api'
import { weatherKeys } from '../api/weather.keys'
import { retryTransientError } from '../../../lib/api/request'

export function useLocationSearch(input: string) {
  const query = input.trim()
  const [debounced, setDebounced] = useState(query)
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 400)
    return () => clearTimeout(timeout)
  }, [query])
  const settled = query === debounced
  const result = useQuery({
    queryKey: weatherKeys.search(debounced),
    queryFn: ({ signal }) => searchLocations(debounced, signal),
    enabled: settled && query.length >= 3 && query.length <= 100,
    staleTime: 24 * 60 * 60_000,
    gcTime: 30 * 60_000,
    retry: retryTransientError,
    refetchOnWindowFocus: false,
  })
  return { ...result, data: settled ? result.data : undefined, settled }
}
