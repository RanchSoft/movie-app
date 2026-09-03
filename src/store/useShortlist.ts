import { useCallback, useEffect, useState } from 'react'

const SHORTLIST_KEY = 'movie-picker:shortlist'

function loadShortlist(): string[] {
  try {
    const raw = localStorage.getItem(SHORTLIST_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function useShortlist() {
  const [shortlist, setShortlist] = useState<string[]>(() => loadShortlist())

  useEffect(() => {
    localStorage.setItem(SHORTLIST_KEY, JSON.stringify(shortlist))
  }, [shortlist])

  const add = useCallback((movieId: string) => {
    setShortlist((prev) => (prev.includes(movieId) ? prev : [...prev, movieId]))
  }, [])

  const remove = useCallback((movieId: string) => {
    setShortlist((prev) => prev.filter((id) => id !== movieId))
  }, [])

  const toggle = useCallback((movieId: string) => {
    setShortlist((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId],
    )
  }, [])

  const clear = useCallback(() => setShortlist([]), [])

  return { shortlist, add, remove, toggle, clear }
}
