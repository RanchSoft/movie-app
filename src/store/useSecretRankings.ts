import { useCallback, useEffect, useState } from 'react'

const KEY = 'movie-picker:secret-rankings'

/** userName -> movieIds in rank order (index 0 = their top pick). */
export type Rankings = Record<string, string[]>

function load(): Rankings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Rankings) : {}
  } catch {
    return {}
  }
}

export function useSecretRankings() {
  const [rankings, setRankings] = useState<Rankings>(() => load())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(rankings))
  }, [rankings])

  const submitRanking = useCallback((user: string, movieIds: string[]) => {
    setRankings((prev) => ({ ...prev, [user]: movieIds }))
  }, [])

  const clearRanking = useCallback((user: string) => {
    setRankings((prev) => {
      if (!(user in prev)) return prev
      const next = { ...prev }
      delete next[user]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setRankings({}), [])

  return { rankings, submitRanking, clearRanking, clearAll }
}
