import type { Movie, MovieStats } from '../types'
import { computeRating } from '../ratingSources'
import { formatRuntime } from '../utils/format'
import { isFreeToWatch } from '../utils/availability'

interface Props {
  movie: Movie
  stats: MovieStats
  poolSize: number
  inShortlist: boolean
  onReroll: () => void
  onToggleShortlist: () => void
  onEdit: () => void
  onClose: () => void
}

export function RandomPickModal({ movie, stats, poolSize, inShortlist, onReroll, onToggleShortlist, onEdit, onClose }: Props) {
  const rating = computeRating(movie.ratingSources)
  const free = isFreeToWatch(movie)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-t-xl border border-slate-700 bg-slate-900 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">
            Random pick from {poolSize} match{poolSize === 1 ? '' : 'es'}
          </p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        <div className="flex gap-4 p-4">
          <div className="flex h-40 w-28 flex-none items-center justify-center overflow-hidden rounded bg-slate-800">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
            ) : (
              <span className="px-1 text-center text-xs text-slate-500">{movie.title}</span>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <button type="button" onClick={onEdit} className="text-left text-lg font-bold text-slate-100 hover:underline">
              {movie.kind === 'tv' ? '📺 ' : null}
              {movie.title}
            </button>
            <p className="text-sm text-slate-400">{movie.year ?? ''}</p>
            <div className="flex flex-wrap gap-1">
              {movie.genres.map((g) => (
                <span key={g} className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                  {g}
                </span>
              ))}
              {movie.tags.map((t) => (
                <span key={t} className="rounded border border-slate-600 px-1.5 py-0.5 text-xs text-slate-400">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
              <span>{formatRuntime(movie.runtimeMinutes)}</span>
              {rating !== null ? <span>★ {rating}/5</span> : null}
              {free ? <span className="text-emerald-400">Free</span> : null}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {stats.timesWatched > 0 ? <span className="text-emerald-400">Watched {stats.timesWatched}×</span> : null}
              {stats.timesShortlisted > 0 ? (
                <span className="text-slate-400">Shortlisted {stats.timesShortlisted}×</span>
              ) : null}
            </div>
            {movie.availability.physical.length > 0 || movie.availability.streaming.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1 text-xs text-slate-500">
                {movie.availability.physical.map((c, i) => (
                  <span key={`p${i}`} className="rounded border border-slate-700 px-1.5 py-0.5">
                    {c.format}
                  </span>
                ))}
                {movie.availability.streaming.map((s) => (
                  <span key={s.service} className="rounded border border-slate-700 px-1.5 py-0.5">
                    {s.service}
                    {s.price ? ` $${s.price}` : ''}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={onReroll}
            disabled={poolSize <= 1}
            className="flex-1 rounded bg-slate-700 py-2 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-40"
          >
            🎲 Reroll
          </button>
          <button
            type="button"
            onClick={onToggleShortlist}
            className={`flex-1 rounded py-2 text-sm font-medium ${
              inShortlist ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-100 text-slate-900 hover:bg-white'
            }`}
          >
            {inShortlist ? 'In shortlist ✓' : '+ Add to shortlist'}
          </button>
        </div>
      </div>
    </div>
  )
}
