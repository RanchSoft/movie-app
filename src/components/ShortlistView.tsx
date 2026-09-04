import { useState } from 'react'
import { useLibrary } from '../store/LibraryContext'
import { useUsers } from '../store/useUsers'
import { useSecretRankings } from '../store/useSecretRankings'
import { useVetoes } from '../store/useVetoes'
import { SecretRanking } from './SecretRanking'
import { VetoPanel } from './VetoPanel'
import { formatRuntime, parseTagList, todayIso } from '../utils/format'

interface Props {
  shortlist: string[]
  onRemove: (movieId: string) => void
  onClear: () => void
}

export function ShortlistView({ shortlist, onRemove, onClear }: Props) {
  const { movies, addSession } = useLibrary()
  const { users } = useUsers()
  const { rankings, submitRanking, clearAll: clearRankings } = useSecretRankings()
  const { vetoes, setVeto, clearVeto, clearAll: clearVetoes } = useVetoes()
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [pickMethod, setPickMethod] = useState<'random' | 'manual' | null>(null)
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [extraAttendees, setExtraAttendees] = useState('')
  const [notes, setNotes] = useState('')
  const [rolling, setRolling] = useState(false)
  const [copied, setCopied] = useState(false)

  const toggleAttendee = (user: string) =>
    setSelectedAttendees((prev) => (prev.includes(user) ? prev.filter((u) => u !== user) : [...prev, user]))

  const shortlistMovies = shortlist
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m)

  const vetoedIds = new Set(Object.values(vetoes))
  const eligibleMovies = shortlistMovies.filter((m) => !vetoedIds.has(m.id))

  const pickRandom = () => {
    if (eligibleMovies.length === 0) return
    setRolling(true)
    let ticks = 0
    const interval = setInterval(() => {
      const rand = eligibleMovies[Math.floor(Math.random() * eligibleMovies.length)]
      setPickedId(rand.id)
      ticks += 1
      if (ticks > 12) {
        clearInterval(interval)
        setRolling(false)
        setPickMethod('random')
      }
    }, 80)
  }

  const pickManual = (id: string) => {
    setPickedId(id)
    setPickMethod('manual')
  }

  const saveSession = () => {
    const extras = parseTagList(extraAttendees).filter(
      (name) => !selectedAttendees.some((u) => u.toLowerCase() === name.toLowerCase()),
    )
    addSession({
      date: todayIso(),
      shortlistMovieIds: shortlist,
      pickedMovieId: pickedId,
      pickMethod,
      attendees: [...selectedAttendees, ...extras],
      notes: notes.trim() || undefined,
    })
    setPickedId(null)
    setPickMethod(null)
    setSelectedAttendees([])
    setExtraAttendees('')
    setNotes('')
    onClear()
    clearRankings()
    clearVetoes()
  }

  const clearShortlist = () => {
    onClear()
    clearRankings()
    clearVetoes()
  }

  const pickedMovie = pickedId ? movies.find((m) => m.id === pickedId) : null

  const copyShortlist = async () => {
    const lines = shortlistMovies.map((m) => `- ${m.title}${m.year ? ` (${m.year})` : ''}`)
    const text = `Tonight's shortlist:\n${lines.join('\n')}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      alert(text)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Tonight's shortlist ({shortlistMovies.length})</h1>
        {shortlistMovies.length > 0 ? (
          <div className="flex items-center gap-3">
            <button type="button" onClick={copyShortlist} className="text-sm text-slate-400 hover:text-slate-200">
              {copied ? 'Copied ✓' : '📋 Copy list'}
            </button>
            <button type="button" onClick={clearShortlist} className="text-sm text-slate-400 hover:text-red-400">
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {shortlistMovies.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No movies shortlisted yet. Go to Library and add some.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {shortlistMovies.map((movie) => {
              const vetoed = vetoedIds.has(movie.id)
              return (
                <div
                  key={movie.id}
                  className={`flex items-center justify-between rounded border px-3 py-2 ${
                    pickedId === movie.id
                      ? 'border-emerald-500 bg-emerald-950/40'
                      : vetoed
                        ? 'border-slate-800 bg-slate-900/40'
                        : 'border-slate-700 bg-slate-800/40'
                  }`}
                >
                  <button type="button" onClick={() => pickManual(movie.id)} className="flex-1 text-left">
                    <span className={`font-medium ${vetoed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {movie.title}
                    </span>{' '}
                    <span className="text-xs text-slate-400">{formatRuntime(movie.runtimeMinutes)}</span>
                    {vetoed ? <span className="ml-1.5 text-xs text-red-400">🚫 vetoed</span> : null}
                  </button>
                  <button type="button" onClick={() => onRemove(movie.id)} className="px-2 text-slate-500 hover:text-red-400">
                    ✕
                  </button>
                </div>
              )
            })}
          </div>

          <VetoPanel movies={shortlistMovies} users={users} vetoes={vetoes} onSetVeto={setVeto} onClearVeto={clearVeto} />

          <SecretRanking
            movies={eligibleMovies}
            users={users}
            rankings={rankings}
            onSubmit={submitRanking}
            onClearAll={clearRankings}
          />

          <button
            type="button"
            onClick={pickRandom}
            disabled={rolling || eligibleMovies.length === 0}
            className="rounded bg-emerald-600 py-3 text-base font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
          >
            {rolling
              ? 'Picking…'
              : eligibleMovies.length === 0
                ? 'Everything vetoed — undo one to roll'
                : '🎲 Pick random'}
          </button>

          {pickedMovie ? (
            <div className="rounded-lg border border-emerald-600 bg-emerald-950/30 p-4">
              <p className="text-sm text-emerald-300">Tonight's pick{pickMethod === 'manual' ? ' (manual)' : ''}:</p>
              <p className="text-lg font-bold text-slate-100">{pickedMovie.title}</p>

              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400">Who's watching</span>
                  {users.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {users.map((user) => {
                        const selected = selectedAttendees.includes(user)
                        return (
                          <button
                            key={user}
                            type="button"
                            onClick={() => toggleAttendee(user)}
                            className={`rounded px-2.5 py-1 text-xs font-medium ${
                              selected
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            }`}
                          >
                            {selected ? '✓ ' : ''}
                            {user}
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                  <input
                    value={extraAttendees}
                    onChange={(e) => setExtraAttendees(e.target.value)}
                    placeholder={users.length > 0 ? 'Anyone else? (comma separated)' : "Who's watching (comma separated)"}
                    className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-400">Notes</span>
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveSession}
                  className="mt-1 rounded bg-slate-100 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
                >
                  Save & log this movie night
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
