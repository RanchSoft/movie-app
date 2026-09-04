import { useCallback, useEffect, useState } from 'react'

const KEY = 'movie-picker:vetoes'

/** userName -> the one movieId they've ruled out. */
export type Vetoes = Record<string, string>

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

  const setVeto = useCallback((user: string, movieId: string) => {
    setVetoes((prev) => ({ ...prev, [user]: movieId }))
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

  return { vetoes, setVeto, clearVeto, clearAll }
}
