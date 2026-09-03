import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useLibrary } from '../store/LibraryContext'
import { formatRuntime } from '../utils/format'

export function StatsView() {
  const { movies, sessions, statsFor } = useLibrary()

  const data = useMemo(() => {
    const picks = sessions.filter((s) => s.pickedMovieId)
    const movieById = new Map(movies.map((m) => [m.id, m]))

    const totalMinutes = picks.reduce((sum, s) => sum + (movieById.get(s.pickedMovieId!)?.runtimeMinutes ?? 0), 0)
    const neverWatchedCount = movies.filter((m) => statsFor(m.id).timesWatched === 0).length

    const genreCounts = new Map<string, number>()
    for (const s of picks) {
      const movie = movieById.get(s.pickedMovieId!)
      if (!movie) continue
      for (const g of movie.genres) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)
    }
    const topGenres = Array.from(genreCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const maxGenreCount = topGenres[0]?.[1] ?? 1

    const withStats = movies.map((m) => ({ movie: m, stats: statsFor(m.id) }))

    const bridesmaids = withStats
      .filter(({ stats }) => stats.timesShortlisted >= 2 && stats.timesWatched === 0)
      .sort((a, b) => b.stats.timesShortlisted - a.stats.timesShortlisted)
      .slice(0, 5)

    const mostWatched = withStats
      .filter(({ stats }) => stats.timesWatched > 0)
      .sort((a, b) => b.stats.timesWatched - a.stats.timesWatched)
      .slice(0, 5)

    const waitingToBeDiscovered = withStats
      .filter(({ stats }) => stats.timesWatched === 0)
      .sort((a, b) => a.movie.addedAt.localeCompare(b.movie.addedAt))
      .slice(0, 5)

    const attendeeCounts = new Map<string, number>()
    for (const s of sessions) {
      for (const a of s.attendees) attendeeCounts.set(a, (attendeeCounts.get(a) ?? 0) + 1)
    }
    const topAttendees = Array.from(attendeeCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return {
      totalNights: sessions.length,
      totalPicks: picks.length,
      totalMovies: movies.filter((m) => m.kind === 'movie').length,
      totalTv: movies.filter((m) => m.kind === 'tv').length,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      neverWatchedCount,
      topGenres,
      maxGenreCount,
      bridesmaids,
      mostWatched,
      waitingToBeDiscovered,
      topAttendees,
    }
  }, [movies, sessions, statsFor])

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-slate-100">Stats</h1>
        <p className="py-8 text-center text-sm text-slate-500">
          Log a movie night (Shortlist → pick → save) to start seeing stats here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-semibold text-slate-100">Stats</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Movie nights logged" value={data.totalNights} />
        <StatTile label="Nights with a pick" value={data.totalPicks} />
        <StatTile label="Est. hours watched" value={data.totalHours} />
        <StatTile label="Never watched" value={data.neverWatchedCount} />
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
        <p>
          {data.totalMovies} movie{data.totalMovies === 1 ? '' : 's'} · {data.totalTv} TV show
          {data.totalTv === 1 ? '' : 's'} in your library
        </p>
      </div>

      {data.topGenres.length > 0 ? (
        <Section title="Top genres watched">
          <div className="flex flex-col gap-1.5">
            {data.topGenres.map(([genre, count]) => (
              <div key={genre} className="flex items-center gap-2">
                <span className="w-24 flex-none truncate text-xs text-slate-300">{genre}</span>
                <div className="h-2 flex-1 rounded bg-slate-800">
                  <div
                    className="h-2 rounded bg-emerald-600"
                    style={{ width: `${(count / data.maxGenreCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 flex-none text-right text-xs text-slate-400">{count}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {data.bridesmaids.length > 0 ? (
        <Section title="Perennial bridesmaids" subtitle="Shortlisted often, never actually picked">
          <MovieList
            items={data.bridesmaids.map(({ movie, stats }) => ({
              movie,
              detail: `Shortlisted ${stats.timesShortlisted}×`,
            }))}
          />
        </Section>
      ) : null}

      {data.mostWatched.length > 0 ? (
        <Section title="Most watched">
          <MovieList
            items={data.mostWatched.map(({ movie, stats }) => ({
              movie,
              detail: `Watched ${stats.timesWatched}×`,
            }))}
          />
        </Section>
      ) : null}

      {data.waitingToBeDiscovered.length > 0 ? (
        <Section title="Waiting to be discovered" subtitle="Never watched, longest in your library">
          <MovieList
            items={data.waitingToBeDiscovered.map(({ movie }) => ({
              movie,
              detail: formatRuntime(movie.runtimeMinutes),
            }))}
          />
        </Section>
      ) : null}

      {data.topAttendees.length > 0 ? (
        <Section title="Who's been around">
          <div className="flex flex-col gap-1">
            {data.topAttendees.map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{name}</span>
                <span className="text-slate-400">{count} night{count === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
      <h2 className="font-medium text-slate-100">{title}</h2>
      {subtitle ? <p className="mb-2 text-xs text-slate-500">{subtitle}</p> : <div className="mb-2" />}
      {children}
    </div>
  )
}

function MovieList({ items }: { items: { movie: { id: string; title: string; year?: number }; detail: string }[] }) {
  return (
    <div className="flex flex-col gap-1">
      {items.map(({ movie, detail }) => (
        <div key={movie.id} className="flex items-center justify-between text-sm">
          <span className="text-slate-200">
            {movie.title} {movie.year ? <span className="text-slate-500">({movie.year})</span> : null}
          </span>
          <span className="text-slate-400">{detail}</span>
        </div>
      ))}
    </div>
  )
}
