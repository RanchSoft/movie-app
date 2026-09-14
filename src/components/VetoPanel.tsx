import { useState } from 'react'
import type { Movie } from '../types'
import type { Vetoes } from '../store/useVetoes'

interface Props {
  movies: Movie[]
  users: string[]
  vetoes: Vetoes
  onToggleVeto: (user: string, movieId: string) => void
  onClearVeto: (user: string) => void
}

export function VetoPanel({ movies, users, vetoes, onToggleVeto, onClearVeto }: Props) {
  const [activeUser, setActiveUser] = useState<string | null>(null)

  if (movies.length === 0) return null

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
        <p className="font-medium text-slate-200">🙅 Veto</p>
        <p className="mt-1">
          Add names for tonight's crew in Settings to let everyone rule out movies before the roll.
        </p>
      </div>
    )
  }

  const movieById = new Map(movies.map((m) => [m.id, m]))

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
      <p className="font-medium text-slate-100">🙅 Veto</p>
      <p className="mt-1 text-xs text-slate-500">Each person can rule out as many movies as they want before the random pick.</p>

      <div className="mt-3 flex flex-col gap-2">
        {users.map((user) => {
          const vetoedIds = vetoes[user] ?? []
          const vetoedMovies = vetoedIds.map((id) => movieById.get(id)).filter((m): m is Movie => !!m)

          if (activeUser === user) {
            return (
              <div key={user} className="rounded border border-slate-600 bg-slate-900/40 p-2">
                <p className="mb-1.5 text-xs text-slate-300">{user}, tap to veto or un-veto.</p>
                <div className="flex flex-col gap-1">
                  {movies.map((movie) => {
                    const vetoed = vetoedIds.includes(movie.id)
                    return (
                      <button
                        key={movie.id}
                        type="button"
                        onClick={() => onToggleVeto(user, movie.id)}
                        className={`flex items-center gap-2 rounded px-2 py-1 text-left text-sm ${
                          vetoed ? 'bg-red-950/40 text-red-300' : 'text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <span>{vetoed ? '🚫' : '☐'}</span>
                        {movie.title}
                      </button>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveUser(null)}
                  className="mt-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Done
                </button>
              </div>
            )
          }

          return (
            <div key={user} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-200">{user}</span>
              {vetoedMovies.length > 0 ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {vetoedMovies.map((m) => (
                    <span key={m.id} className="text-red-400">
                      🚫 {m.title}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setActiveUser(user)}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onClearVeto(user)}
                    className="text-xs text-slate-500 hover:text-red-400"
                  >
                    Undo all
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveUser(user)}
                  className="rounded bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                >
                  Veto…
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
