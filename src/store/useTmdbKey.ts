import { useCallback, useEffect, useState } from 'react'

const KEY = 'movie-picker:tmdb-api-key'

/** Lives only in this browser's localStorage — never in the repo or the built bundle. */
export function useTmdbKey() {
  const [apiKey, setApiKeyState] = useState<string>(() => localStorage.getItem(KEY) ?? '')

  useEffect(() => {
    if (apiKey) localStorage.setItem(KEY, apiKey)
    else localStorage.removeItem(KEY)
  }, [apiKey])

  const setApiKey = useCallback((value: string) => setApiKeyState(value.trim()), [])

  return { apiKey, setApiKey }
}
