import type { Movie, MovieStats } from '../types'
import { formatRuntime } from '../utils/format'
import { computeRating } from '../ratingSources'

interface Props {
  movie: Movie
  stats: MovieStats
  inShortlist: boolean
  onToggleShortlist: () => void
  onEdit: () => void
}

export function MovieCard({ movie, stats, inShortlist, onToggleShortlist, onEdit }: Props) {
  const rating = computeRating(movie.ratingSources)
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-800/60">
      <button
        type="button"
        onClick={onEdit}
        className="flex aspect-[2/3] w-full items-center justify-center overflow-hidden bg-slate-900 text-left"
      >
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-sm text-slate-500">{movie.title}</span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <button type="button" onClick={onEdit} className="text-left text-sm font-semibold text-slate-100 hover:underline">
          {movie.title} {movie.year ? <span className="text-slate-400">({movie.year})</span> : null}
        </button>
        <div className="flex flex-wrap gap-1 text-xs text-slate-400">
          {movie.genres.slice(0, 3).map((g) => (
            <span key={g} className="rounded bg-slate-700 px-1.5 py-0.5">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
          <span>{formatRuntime(movie.runtimeMinutes)}</span>
          {rating !== null ? <span>★ {rating}/5</span> : null}
        </div>
        {stats.timesWatched > 0 ? (
          <div className="text-xs text-emerald-400">Watched {stats.timesWatched}×</div>
        ) : null}
        <button
          type="button"
          onClick={onToggleShortlist}
          className={`mt-2 rounded px-2 py-1.5 text-xs font-medium transition ${
            inShortlist
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
          }`}
        >
          {inShortlist ? 'In shortlist ✓' : 'Add to shortlist'}
        </button>
      </div>
    </div>
  )
}
