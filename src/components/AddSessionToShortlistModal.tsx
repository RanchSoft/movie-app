import { useState } from 'react'
import type { Movie, WatchSession } from '../types'

interface Props {
  session: WatchSession
  movies: Movie[]
  statsFor: (movieId: string) => { timesWatched: number }
  onConfirm: (movieIds: string[]) => void
  onClose: () => void
}

export function AddSessionToShortlistModal({ session, movies, statsFor, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<'confirm' | 'watched'>('confirm')

  // Ignore any movie that's since been deleted from the library.
  const candidateIds = session.shortlistMovieIds.filter((id) => movies.some((m) => m.id === id))
  const titleFor = (id: string) => movies.find((m) => m.id === id)?.title ?? '(deleted movie)'
  const watchedIds = candidateIds.filter((id) => statsFor(id).timesWatched > 0)

  const handleAdd = () => {
    if (watchedIds.length > 0) {
      setStep('watched')
    } else {
      onConfirm(candidateIds)
      onClose()
    }
  }

  const includeAll = () => {
    onConfirm(candidateIds)
    onClose()
  }

  const skipWatched = () => {
    onConfirm(candidateIds.filter((id) => !watchedIds.includes(id)))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-xl border border-slate-700 bg-slate-900 p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'confirm' ? (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Add to shortlist?</h2>
            <p className="mt-2 text-sm text-slate-400">
              Add these {candidateIds.length} movie{candidateIds.length === 1 ? '' : 's'} from this movie night to
              your current shortlist:
            </p>
            <ul className="mt-2 max-h-48 overflow-y-auto text-sm text-slate-300">
              {candidateIds.map((id) => (
                <li key={id} className="py-0.5">
                  • {titleFor(id)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="button"
                disabled={candidateIds.length === 0}
                onClick={handleAdd}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
              >
                Add to shortlist
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-100">Include already-watched movies?</h2>
            <p className="mt-2 text-sm text-slate-400">
              {watchedIds.length} of these you've already watched:
            </p>
            <ul className="mt-2 max-h-32 overflow-y-auto text-sm text-slate-300">
              {watchedIds.map((id) => (
                <li key={id} className="py-0.5">
                  • {titleFor(id)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={onClose} className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
                Cancel
              </button>
              <button
                type="button"
                onClick={skipWatched}
                className="rounded bg-slate-700 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600"
              >
                Skip watched ({candidateIds.length - watchedIds.length})
              </button>
              <button
                type="button"
                onClick={includeAll}
                className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Include all ({candidateIds.length})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
