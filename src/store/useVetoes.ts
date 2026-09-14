import { useCallback, useEffect, useState } from 'react'

const KEY = 'movie-picker:vetoes'

/** userName -> the movieIds they've ruled out. */
export type Vetoes = Record<string, string[]>

function load(): Vetoes {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Vetoes) : {}
  } catch {
    return {}
  }
}

export function useVetoes() {
  const [vetoes, setVetoes] = useState<Vetoes>(() => load())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(vetoes))
  }, [vetoes])

  const toggleVeto = useCallback((user: string, movieId: string) => {
    setVetoes((prev) => {
      const current = prev[user] ?? []
      const next = current.includes(movieId) ? current.filter((id) => id !== movieId) : [...current, movieId]
      return { ...prev, [user]: next }
    })
  }, [])

  const clearVeto = useCallback((user: string) => {
    setVetoes((prev) => {
      if (!(user in prev)) return prev
      const next = { ...prev }
      delete next[user]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setVetoes({}), [])

  return { vetoes, toggleVeto, clearVeto, clearAll }
}
