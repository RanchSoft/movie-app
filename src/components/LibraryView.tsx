import { useMemo, useState } from 'react'
import { useLibrary } from '../store/LibraryContext'
import type { Movie } from '../types'
import { MovieCard } from './MovieCard'
import { DEFAULT_FILTERS, FilterBar } from './FilterBar'
import type { Filters } from './FilterBar'
import { MovieFormModal } from './MovieFormModal'
import { RandomPickModal } from './RandomPickModal'
import { computeRating } from '../ratingSources'
import { isFreeToWatch } from '../utils/availability'

interface Props {
  shortlist: string[]
  onToggleShortlist: (movieId: string) => void
}

export function LibraryView({ shortlist, onToggleShortlist }: Props) {
  const { movies, addMovie, updateMovie, deleteMovie, statsFor } = useLibrary()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [editingMovie, setEditingMovie] = useState<Movie | null | 'new'>(null)
  const [randomPickId, setRandomPickId] = useState<string | null>(null)

  const genres = useMemo(
    () => Array.from(new Set(movies.flatMap((m) => m.genres))).sort(),
    [movies],
  )
  const tags = useMemo(
    () => Array.from(new Set(movies.flatMap((m) => m.tags))).sort(),
    [movies],
  )
  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    let result = movies.filter((m) => {
      if (q && !m.title.toLowerCase().includes(q)) return false
      if (filters.kind !== 'all' && m.kind !== filters.kind) return false
      if (filters.genre !== 'all' && !m.genres.includes(filters.genre)) return false
      if (filters.tag !== 'all' && !m.tags.includes(filters.tag)) return false
      if (filters.maxRuntime && (m.runtimeMinutes ?? Infinity) > filters.maxRuntime) return false
      if (filters.availability === 'physical' && m.availability.physical.length === 0) return false
      if (filters.availability === 'streaming' && m.availability.streaming.length === 0) return false
      if (filters.availability === 'free' && !isFreeToWatch(m)) return false
      const stats = statsFor(m.id)
      if (filters.watched === 'watched' && stats.timesWatched === 0) return false
      if (filters.watched === 'unwatched' && stats.timesWatched > 0) return false
      return true
    })

    result = result.slice().sort((a, b) => {
      const sa = statsFor(a.id)
      const sb = statsFor(b.id)
      switch (filters.sort) {
        case 'rating':
          return (computeRating(b.ratingSources) ?? -1) - (computeRating(a.ratingSources) ?? -1)
        case 'year':
          return (b.year ?? 0) - (a.year ?? 0)
        case 'timesWatched':
          return sb.timesWatched - sa.timesWatched
        case 'timesShortlisted':
          return sb.timesShortlisted - sa.timesShortlisted
        case 'lastWatched':
          return (sb.lastWatchedDate ?? '').localeCompare(sa.lastWatchedDate ?? '')
        case 'updatedAt':
          return b.updatedAt.localeCompare(a.updatedAt)
        default:
          return a.title.localeCompare(b.title)
      }
    })

    return result
  }, [movies, filters, statsFor])

  const editingInitial = editingMovie === 'new' ? null : editingMovie
  const randomPickMovie = randomPickId ? movies.find((m) => m.id === randomPickId) ?? null : null

  const pickRandom = () => {
    if (filtered.length === 0) return
    setRandomPickId(filtered[Math.floor(Math.random() * filtered.length)].id)
  }

  const reroll = () => {
    if (filtered.length <= 1) return
    let next: Movie
    do {
      next = filtered[Math.floor(Math.random() * filtered.length)]
    } while (next.id === randomPickId)
    setRandomPickId(next.id)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-100">Library ({movies.length})</h1>
        <button
          type="button"
          onClick={() => setEditingMovie('new')}
          className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Add title
        </button>
      </div>

      <FilterBar filters={filters} onChange={setFilters} genres={genres} tags={tags} />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          {movies.length === 0 ? 'Nothing here yet — add your first movie or show.' : 'Nothing matches these filters.'}
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              {filtered.length} title{filtered.length === 1 ? '' : 's'} match
            </p>
            <button
              type="button"
              onClick={pickRandom}
              className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-white"
            >
              🎲 Random pick from these
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              stats={statsFor(movie.id)}
              inShortlist={shortlist.includes(movie.id)}
              onToggleShortlist={() => onToggleShortlist(movie.id)}
              onEdit={() => setEditingMovie(movie)}
            />
          ))}
          </div>
        </>
      )}

      {editingMovie !== null ? (
        <MovieFormModal
          initial={editingInitial}
          stats={editingInitial ? statsFor(editingInitial.id) : null}
          existingMovies={movies}
          onClose={() => setEditingMovie(null)}
          onSave={(data) => {
            if (editingInitial) {
              updateMovie(editingInitial.id, data)
            } else {
              addMovie(data)
            }
            setEditingMovie(null)
          }}
          onDelete={
            editingInitial
              ? () => {
                  deleteMovie(editingInitial.id)
                  setEditingMovie(null)
                }
              : undefined
          }
        />
      ) : null}

      {randomPickMovie ? (
        <RandomPickModal
          movie={randomPickMovie}
          stats={statsFor(randomPickMovie.id)}
          poolSize={filtered.length}
          inShortlist={shortlist.includes(randomPickMovie.id)}
          onReroll={reroll}
          onToggleShortlist={() => onToggleShortlist(randomPickMovie.id)}
          onEdit={() => {
            setEditingMovie(randomPickMovie)
            setRandomPickId(null)
          }}
          onClose={() => setRandomPickId(null)}
        />
      ) : null}
    </div>
  )
}
