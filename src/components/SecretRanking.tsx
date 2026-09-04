import { useEffect, useMemo, useRef, useState } from 'react'
import type { Movie } from '../types'
import type { Rankings } from '../store/useSecretRankings'
import { pickRandomTiebreak, type TiebreakerDef } from '../tiebreakers'

interface Props {
  movies: Movie[]
  users: string[]
  rankings: Rankings
  onSubmit: (user: string, movieIds: string[]) => void
  onClearAll: () => void
}

interface TiebreakState {
  tiedIds: string[]
  spinning: boolean
  displayTitle: string
  method?: TiebreakerDef
  winner?: Movie
}

export function SecretRanking({ movies, users, rankings, onSubmit, onClearAll }: Props) {
  const [topN, setTopN] = useState(3)
  const [activeUser, setActiveUser] = useState<string | null>(null)
  const [picks, setPicks] = useState<string[]>([])
  const [revealed, setRevealed] = useState(false)
  const [tiebreak, setTiebreak] = useState<TiebreakState | null>(null)
  const spinTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (spinTimer.current) clearInterval(spinTimer.current)
  }, [])

  const movieIds = useMemo(() => new Set(movies.map((m) => m.id)), [movies])
  const effectiveTopN = Math.max(1, Math.min(topN, movies.length || 1))

  const submittedUsers = useMemo(
    () => users.filter((u) => (rankings[u] ?? []).some((id) => movieIds.has(id))),
    [users, rankings, movieIds],
  )

  const startRanking = (user: string) => {
    const existing = (rankings[user] ?? []).filter((id) => movieIds.has(id))
    setPicks(existing)
    setActiveUser(user)
  }

  const togglePick = (movieId: string) => {
    setPicks((prev) => {
      if (prev.includes(movieId)) return prev.filter((id) => id !== movieId)
      if (prev.length >= effectiveTopN) return prev
      return [...prev, movieId]
    })
  }

  const submit = () => {
    if (!activeUser || picks.length === 0) return
    onSubmit(activeUser, picks)
    setActiveUser(null)
    setPicks([])
  }

  const cancel = () => {
    setActiveUser(null)
    setPicks([])
  }

  const consensus = useMemo(() => {
    const scores = new Map<string, number>()
    const perUser = new Map<string, Map<string, number>>()
    for (const user of users) {
      const ranking = (rankings[user] ?? []).filter((id) => movieIds.has(id))
      if (ranking.length === 0) continue
      const userRanks = new Map<string, number>()
      ranking.forEach((movieId, index) => {
        const points = ranking.length - index
        scores.set(movieId, (scores.get(movieId) ?? 0) + points)
        userRanks.set(movieId, index + 1)
      })
      perUser.set(user, userRanks)
    }
    const rows = movies
      .filter((m) => (scores.get(m.id) ?? 0) > 0)
      .map((movie) => ({
        movie,
        score: scores.get(movie.id) ?? 0,
        byUser: submittedUsers.map((user) => ({ user, rank: perUser.get(user)?.get(movie.id) ?? null })),
      }))
      .sort((a, b) => b.score - a.score)
    const topScore = rows[0]?.score ?? 0
    const tiedForFirst = rows.filter((r) => r.score === topScore).length
    return { rows, topScore, tiedForFirst }
  }, [movies, rankings, users, movieIds, submittedUsers])

  const tiedMovies = useMemo(
    () =>
      consensus.tiedForFirst > 1
        ? consensus.rows.filter((r) => r.score === consensus.topScore).map((r) => r.movie)
        : [],
    [consensus],
  )
  const tiedIdsKey = useMemo(() => [...tiedMovies.map((m) => m.id)].sort().join(','), [tiedMovies])

  const breakTie = () => {
    if (tiedMovies.length < 2) return
    if (spinTimer.current) clearInterval(spinTimer.current)
    const tiedIds = tiedMovies.map((m) => m.id).sort()
    const choice = pickRandomTiebreak(tiedMovies)
    setTiebreak({ tiedIds, spinning: true, displayTitle: tiedMovies[0].title })
    let ticks = 0
    spinTimer.current = setInterval(() => {
      const rand = tiedMovies[Math.floor(Math.random() * tiedMovies.length)]
      setTiebreak((prev) => (prev ? { ...prev, displayTitle: rand.title } : prev))
      ticks += 1
      if (ticks > 10) {
        if (spinTimer.current) clearInterval(spinTimer.current)
        setTiebreak({
          tiedIds,
          spinning: false,
          displayTitle: choice.winner.title,
          method: choice.method,
          winner: choice.winner,
        })
      }
    }, 80)
  }

  if (movies.length === 0) return null

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200">🤫 Secret ranking</p>
        <p className="mt-1">
          Add names for tonight's crew in Settings to let everyone secretly rank their favorites from the shortlist.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium text-slate-100">🤫 Secret ranking</p>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Top picks</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTopN((n) => Math.max(1, n - 1))}
              disabled={!!activeUser || effectiveTopN <= 1}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-sm font-semibold text-slate-100 hover:bg-slate-600 disabled:opacity-40"
            >
              –
            </button>
            <span className="w-5 text-center text-sm font-semibold text-slate-100">{effectiveTopN}</span>
            <button
              type="button"
              onClick={() => setTopN((n) => Math.min(Math.max(1, movies.length), n + 1))}
              disabled={!!activeUser || effectiveTopN >= movies.length}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-700 text-sm font-semibold text-slate-100 hover:bg-slate-600 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {activeUser ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm text-emerald-300">
            {activeUser}, tap your top {effectiveTopN} in order ({picks.length}/{effectiveTopN}). Tap again to
            remove.
          </p>
          <div className="flex flex-col gap-1.5">
            {movies.map((movie) => {
              const rank = picks.indexOf(movie.id)
              const selected = rank !== -1
              return (
                <button
                  key={movie.id}
                  type="button"
                  onClick={() => togglePick(movie.id)}
                  className={`flex items-center gap-2 rounded border px-3 py-2 text-left text-sm ${
                    selected
                      ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                      : 'border-slate-700 bg-slate-900/40 text-slate-200 hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[11px] font-semibold ${
                      selected ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {selected ? rank + 1 : ''}
                  </span>
                  {movie.title}
                </button>
              )
            })}
          </div>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={picks.length === 0}
              className="flex-1 rounded bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Submit &amp; hide
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {users.map((user) => {
              const done = submittedUsers.includes(user)
              return (
                <button
                  key={user}
                  type="button"
                  onClick={() => startRanking(user)}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    done
                      ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-900/70'
                      : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
                  }`}
                >
                  {done ? `✅ ${user}` : `☐ ${user}`}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              disabled={submittedUsers.length === 0}
              className="flex-1 rounded bg-slate-100 py-2 text-sm font-semibold text-slate-900 hover:bg-white disabled:opacity-50"
            >
              {revealed ? 'Hide picks' : `👀 Reveal picks (${submittedUsers.length})`}
            </button>
            {submittedUsers.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  onClearAll()
                  setRevealed(false)
                }}
                className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-red-900/60"
              >
                Reset
              </button>
            ) : null}
          </div>

          {revealed ? (
            <div className="mt-3">
              {consensus.tiedForFirst > 1 ? (
                <div className="mb-2 rounded border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
                  <p>
                    🤝 It's a {consensus.tiedForFirst}-way tie for first at {consensus.topScore} point
                    {consensus.topScore === 1 ? '' : 's'}.
                  </p>
                  {tiebreak && tiebreak.tiedIds.join(',') === tiedIdsKey ? (
                    <div className="mt-2">
                      {tiebreak.spinning ? (
                        <p className="animate-pulse font-semibold text-amber-200">🎲 {tiebreak.displayTitle}…</p>
                      ) : (
                        <>
                          <p className="font-semibold text-amber-200">
                            {tiebreak.method?.icon} {tiebreak.method?.label} → 🏆 {tiebreak.winner?.title}
                          </p>
                          <p className="mt-0.5 text-amber-400">
                            {tiebreak.method && tiebreak.winner ? tiebreak.method.describe(tiebreak.winner) : null}
                          </p>
                          <button
                            type="button"
                            onClick={breakTie}
                            className="mt-1.5 rounded bg-amber-900/60 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-900"
                          >
                            🎲 Break it again
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={breakTie}
                      className="mt-2 w-full rounded bg-amber-700 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      🎲 Break the tie
                    </button>
                  )}
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400">
                      <th className="pb-1 pr-2 font-medium">Movie</th>
                      {submittedUsers.map((user) => (
                        <th key={user} className="pb-1 px-2 text-center font-medium">
                          {user}
                        </th>
                      ))}
                      <th className="pb-1 pl-2 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consensus.rows.map((row) => {
                      const isTopTie = row.score === consensus.topScore && consensus.tiedForFirst > 1
                      const isSoleWinner = row.score === consensus.topScore && consensus.tiedForFirst === 1
                      const tiebreakResolved =
                        tiebreak && !tiebreak.spinning && tiebreak.tiedIds.join(',') === tiedIdsKey
                      const isTiebreakWinner = isTopTie && tiebreakResolved && tiebreak?.winner?.id === row.movie.id
                      return (
                        <tr
                          key={row.movie.id}
                          className={isTopTie || isSoleWinner ? 'bg-amber-950/30 text-amber-200' : 'text-slate-200'}
                        >
                          <td className="py-1 pr-2">
                            {isSoleWinner ? '🏆 ' : ''}
                            {isTiebreakWinner ? '🏆 ' : isTopTie ? '🤝 ' : ''}
                            {row.movie.title}
                          </td>
                          {row.byUser.map(({ user, rank }) => (
                            <td key={user} className="py-1 px-2 text-center text-slate-400">
                              {rank ?? '—'}
                            </td>
                          ))}
                          <td className="py-1 pl-2 text-right font-semibold">{row.score}</td>
                        </tr>
                      )
                    })}
                    {consensus.rows.length === 0 ? (
                      <tr>
                        <td colSpan={submittedUsers.length + 2} className="py-2 text-center text-slate-500">
                          No picks yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
