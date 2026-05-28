import { useState, useEffect, useCallback } from 'react'

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export interface PaginationState {
  page: number
  limit: number
  totalPages: number
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  prevPage: () => void
  canNextPage: boolean
  canPrevPage: boolean
}

export function usePagination(total: number, initialLimit = 20): PaginationState {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(initialLimit)

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const canNextPage = page < totalPages
  const canPrevPage = page > 1

  const nextPage = useCallback(() => {
    if (canNextPage) setPage((p) => p + 1)
  }, [canNextPage])

  const prevPage = useCallback(() => {
    if (canPrevPage) setPage((p) => p - 1)
  }, [canPrevPage])

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  return { page, limit, totalPages, setPage, setLimit: handleSetLimit, nextPage, prevPage, canNextPage, canPrevPage }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }, [key])

  return [storedValue, setValue]
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 768px)')
}
