import { useState, useEffect, useRef } from 'preact/hooks'

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 min

export function useFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const tick = useRef(0)

  const load = async () => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data as T)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      cache.set(key, { data: result, ts: Date.now() })
      setData(result)
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [key])

  return { data, isLoading, error, refetch: () => { tick.current++; load() } }
}
