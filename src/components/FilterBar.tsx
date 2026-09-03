export interface Filters {
  query: string
  kind: 'all' | 'movie' | 'tv'
  genre: string
  tag: string
  maxRuntime: number | null
  availability: 'all' | 'physical' | 'streaming' | 'free'
  watched: 'all' | 'watched' | 'unwatched'
  sort: 'title' | 'rating' | 'timesWatched' | 'lastWatched' | 'timesShortlisted' | 'year' | 'updatedAt'
}

export const DEFAULT_FILTERS: Filters = {
  query: '',
  kind: 'all',
  genre: 'all',
  tag: 'all',
  maxRuntime: null,
  availability: 'all',
  watched: 'all',
  sort: 'title',
}

interface Props {
  filters: Filters
  onChange: (filters: Filters) => void
  genres: string[]
  tags: string[]
}

export function FilterBar({ filters, onChange, genres, tags }: Props) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800/40 p-3">
      <input
        type="search"
        placeholder="Search title..."
        value={filters.query}
        onChange={(e) => set('query', e.target.value)}
        className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.kind}
          onChange={(e) => set('kind', e.target.value as Filters['kind'])}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="all">Movies & TV</option>
          <option value="movie">Movies only</option>
          <option value="tv">TV shows only</option>
        </select>
        <select
          value={filters.genre}
          onChange={(e) => set('genre', e.target.value)}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="all">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={filters.tag}
          onChange={(e) => set('tag', e.target.value)}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="all">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={filters.availability}
          onChange={(e) => set('availability', e.target.value as Filters['availability'])}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="all">Any availability</option>
          <option value="physical">Physical only</option>
          <option value="streaming">Streaming only</option>
          <option value="free">Free only</option>
        </select>
        <select
          value={filters.watched}
          onChange={(e) => set('watched', e.target.value as Filters['watched'])}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="all">Watched or not</option>
          <option value="watched">Watched before</option>
          <option value="unwatched">Never watched</option>
        </select>
        <select
          value={filters.maxRuntime ?? ''}
          onChange={(e) => set('maxRuntime', e.target.value ? Number(e.target.value) : null)}
          className="rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="">Any runtime</option>
          <option value="90">Under 90m</option>
          <option value="120">Under 2h</option>
          <option value="150">Under 2.5h</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => set('sort', e.target.value as Filters['sort'])}
          className="ml-auto rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
        >
          <option value="title">Sort: Title</option>
          <option value="year">Sort: Year</option>
          <option value="rating">Sort: Rating</option>
          <option value="timesWatched">Sort: Times watched</option>
          <option value="lastWatched">Sort: Last watched</option>
          <option value="timesShortlisted">Sort: Appears in lists</option>
          <option value="updatedAt">Sort: Last updated</option>
        </select>
      </div>
    </div>
  )
}
