import { useCallback, useState } from 'react'

/** Generic "when was this banner/prompt last dismissed" tracker, keyed by an arbitrary id. */
export function useDismissedAt(key: string) {
  const storageKey = `movie-picker:dismissed:${key}`
  const [dismissedAt, setDismissedAtState] = useState<string | null>(() => localStorage.getItem(storageKey))

  const dismiss = useCallback(() => {
    const now = new Date().toISOString()
    localStorage.setItem(storageKey, now)
    setDismissedAtState(now)
  }, [storageKey])

  return { dismissedAt, dismiss }
}
