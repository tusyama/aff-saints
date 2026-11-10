import { useCallback, useEffect, useRef, useState } from 'react'
import { api, ApiError } from './client'

type LoadResult<T> = {
  data: T | null
  error: ApiError | null
  fetching: boolean
  reload: () => void
}

export function useGet<T>(path: string | null): LoadResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [fetching, setFetching] = useState(path !== null)
  const [loadedPath, setLoadedPath] = useState(path)
  const request = useRef(0)

  if (loadedPath !== path) {
    setLoadedPath(path)
    setData(null)
    setError(null)
    setFetching(path !== null)
  }

  const reload = useCallback(() => {
    if (!path) return
    const current = ++request.current
    setFetching(true)
    void api<T>(path)
      .then((next) => {
        if (request.current !== current) return
        setData(next)
        setError(null)
      })
      .catch((caught: unknown) => {
        if (request.current !== current) return
        setError(caught instanceof ApiError ? caught : new ApiError('INTERNAL', [], true))
      })
      .finally(() => {
        if (request.current === current) setFetching(false)
      })
  }, [path])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, error, fetching, reload }
}

type Command = {
  error: ApiError | null
  pending: boolean
  run: (work: () => Promise<void>) => Promise<boolean>
}

export function useCommand(): Command {
  const [error, setError] = useState<ApiError | null>(null)
  const [pending, setPending] = useState(false)

  const run = useCallback(async (work: () => Promise<void>) => {
    setPending(true)
    setError(null)
    try {
      await work()
      return true
    } catch (caught) {
      setError(caught instanceof ApiError ? caught : new ApiError('INTERNAL', [], true))
      return false
    } finally {
      setPending(false)
    }
  }, [])

  return { error, pending, run }
}
