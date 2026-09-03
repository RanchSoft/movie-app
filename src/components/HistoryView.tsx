import { useLibrary } from '../store/LibraryContext'
import { formatDate } from '../utils/format'

export function HistoryView() {
  const { movies, sessions, deleteSession } = useLibrary()

  const sorted = sessions.slice().sort((a, b) => b.date.localeCompare(a.date))
  const titleFor = (id: string | null) => movies.find((m) => m.id === id)?.title ?? '(deleted movie)'

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold text-slate-100">History ({sessions.length})</h1>
      {sorted.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No movie nights logged yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((session) => (
            <div key={session.id} className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400">{formatDate(session.date)}</p>
                  <p className="text-base font-semibold text-slate-100">
                    {session.pickedMovieId ? titleFor(session.pickedMovieId) : '(no pick recorded)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this history entry?')) deleteSession(session.id)
                  }}
                  className="text-slate-500 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
              {session.attendees.length > 0 ? (
                <p className="mt-1 text-xs text-slate-400">With: {session.attendees.join(', ')}</p>
              ) : null}
              {session.shortlistMovieIds.length > 1 ? (
                <p className="mt-1 text-xs text-slate-500">
                  Shortlist: {session.shortlistMovieIds.map(titleFor).join(', ')}
                </p>
              ) : null}
              {session.notes ? <p className="mt-1 text-sm text-slate-300">{session.notes}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
