import { useState, useEffect, useRef } from 'preact/hooks'

interface FetchState<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 min
const FETCH_TIMEOUT = 15_000   // 15s — beyond this we surface an error instead of an infinite skeleton

export function useFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): FetchState<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const load = async () => {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data as T)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const result = await Promise.race([
        fetcher(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new Error('Request timed out. Check your connection and retry.')),
            FETCH_TIMEOUT,
          )
        }),
      ])
      cache.set(key, { data: result, ts: Date.now() })
      if (mounted.current) setData(result)
    } catch (e) {
      if (mounted.current) setError(e as Error)
    } finally {
      if (timer) clearTimeout(timer)
      if (mounted.current) setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [key])

  return { data, isLoading, error, refetch: () => load() }
}
