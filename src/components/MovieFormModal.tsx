import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Movie, MovieKind, MovieStats, PhysicalCopy, PhysicalFormat, StreamingAvailability } from '../types'
import { parseTagList, formatDate } from '../utils/format'
import { computeRating, RATING_SOURCES } from '../ratingSources'
import { useTmdbKey } from '../store/useTmdbKey'
import { useStreamingPrefs } from '../store/useStreamingPrefs'
import { search as tmdbSearch, getDetails as getTmdbDetails, getWatchProviders } from '../tmdb'
import type { TmdbSearchResult, TmdbProvider } from '../tmdb'

const FREE_CATEGORIES = new Set<TmdbProvider['category']>(['flatrate', 'free', 'ads'])

/** Matches TMDb's provider list against the services you told us you have, deduped and preferring a free/subscription match over a paid one for the same service. */
function matchProviders(providers: TmdbProvider[], myServices: string[]): { service: string; paid: boolean }[] {
  const mine = new Set(myServices.map((s) => s.toLowerCase()))
  const bestByService = new Map<string, boolean>() // service (lowercased) -> paid?
  for (const p of providers) {
    if (!mine.has(p.name.toLowerCase())) continue
    const paid = !FREE_CATEGORIES.has(p.category)
    const existing = bestByService.get(p.name.toLowerCase())
    if (existing === undefined || (existing && !paid)) bestByService.set(p.name.toLowerCase(), paid)
  }
  const byLower = new Map(providers.map((p) => [p.name.toLowerCase(), p.name]))
  return Array.from(bestByService.entries()).map(([lower, paid]) => ({ service: byLower.get(lower) ?? lower, paid }))
}

const PHYSICAL_FORMATS: PhysicalFormat[] = ['DVD', 'Blu-ray', '4K UHD', 'VHS', 'Digital Copy']

interface Props {
  initial: Movie | null
  stats: MovieStats | null
  existingMovies: Movie[]
  onSave: (movie: Omit<Movie, 'id' | 'addedAt' | 'updatedAt'>) => void
  onDelete?: () => void
  onClose: () => void
}

export function MovieFormModal({ initial, stats, existingMovies, onSave, onDelete, onClose }: Props) {
  const { apiKey } = useTmdbKey()
  const { services: myServices, region } = useStreamingPrefs()
  const [kind, setKind] = useState<MovieKind>(initial?.kind ?? 'movie')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [year, setYear] = useState(initial?.year?.toString() ?? '')
  const [genres, setGenres] = useState(initial?.genres.join(', ') ?? '')
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '')
  const [runtime, setRuntime] = useState(initial?.runtimeMinutes?.toString() ?? '')
  const [ratingInputs, setRatingInputs] = useState<Record<string, string>>(() => {
    const entries = RATING_SOURCES.map((def) => [def.id, initial?.ratingSources[def.id]?.toString() ?? ''])
    return Object.fromEntries(entries)
  })
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [streaming, setStreaming] = useState<StreamingAvailability[]>(initial?.availability.streaming ?? [])
  const [physical, setPhysical] = useState<PhysicalCopy[]>(initial?.availability.physical ?? [])

  const [tmdbQuery, setTmdbQuery] = useState('')
  const [tmdbResults, setTmdbResults] = useState<TmdbSearchResult[] | null>(null)
  const [tmdbBusy, setTmdbBusy] = useState<'search' | 'details' | null>(null)
  const [tmdbError, setTmdbError] = useState<string | null>(null)
  const [providerNote, setProviderNote] = useState<string | null>(null)

  const addPhysicalCopy = () => setPhysical((p) => [...p, { format: 'Blu-ray' }])
  const updatePhysicalCopy = (idx: number, updates: Partial<PhysicalCopy>) =>
    setPhysical((p) => p.map((c, i) => (i === idx ? { ...c, ...updates } : c)))
  const removePhysicalCopy = (idx: number) => setPhysical((p) => p.filter((_, i) => i !== idx))

  const addStreaming = () => setStreaming((s) => [...s, { service: '' }])
  const updateStreaming = (idx: number, updates: Partial<StreamingAvailability>) =>
    setStreaming((s) => s.map((entry, i) => (i === idx ? { ...entry, ...updates } : entry)))
  const removeStreaming = (idx: number) => setStreaming((s) => s.filter((_, i) => i !== idx))

  const canSave = title.trim().length > 0

  const ratingSources = Object.fromEntries(
    Object.entries(ratingInputs)
      .filter(([, v]) => v.trim() !== '')
      .map(([k, v]) => [k, Number(v)]),
  )
  const previewRating = computeRating(ratingSources)

  const duplicate = existingMovies.find(
    (m) =>
      m.id !== initial?.id &&
      m.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      (m.year ?? null) === (year ? Number(year) : null),
  )

  const runTmdbSearch = async () => {
    if (!apiKey || !tmdbQuery.trim()) return
    setTmdbBusy('search')
    setTmdbError(null)
    try {
      setTmdbResults(await tmdbSearch(apiKey, tmdbQuery.trim(), kind))
    } catch (err) {
      setTmdbError(err instanceof Error ? err.message : String(err))
    } finally {
      setTmdbBusy(null)
    }
  }

  const applyTmdbResult = async (result: TmdbSearchResult) => {
    if (!apiKey) return
    setTmdbBusy('details')
    setTmdbError(null)
    setProviderNote(null)
    try {
      const details = await getTmdbDetails(apiKey, result.id, kind)
      setTitle(details.title)
      if (details.year) setYear(details.year.toString())
      if (details.genres.length > 0) setGenres(details.genres.join(', '))
      if (details.runtimeMinutes) setRuntime(details.runtimeMinutes.toString())
      if (details.posterUrl) setPosterUrl(details.posterUrl)
      setTmdbResults(null)
      setTmdbQuery('')

      if (myServices.length > 0) {
        try {
          const providers = await getWatchProviders(apiKey, result.id, kind, region)
          const matches = matchProviders(providers, myServices)
          setStreaming((prev) => {
            const already = new Set(prev.map((s) => s.service.trim().toLowerCase()))
            const additions = matches
              .filter((m) => !already.has(m.service.toLowerCase()))
              .map((m) => ({ service: m.service, paid: m.paid || undefined }))
            return [...prev, ...additions]
          })
          setProviderNote(
            matches.length > 0
              ? `Added ${matches.length} streaming option${matches.length === 1 ? '' : 's'} from your services.`
              : `None of your services carry this in ${region}.`,
          )
        } catch (err) {
          setProviderNote(`Couldn't check streaming providers: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    } catch (err) {
      setTmdbError(err instanceof Error ? err.message : String(err))
    } finally {
      setTmdbBusy(null)
    }
  }

  const handleSave = () => {
    if (!canSave) return
    onSave({
      kind,
      title: title.trim(),
      year: year ? Number(year) : undefined,
      genres: parseTagList(genres),
      tags: parseTagList(tags),
      runtimeMinutes: runtime ? Number(runtime) : undefined,
      ratingSources,
      posterUrl: posterUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      availability: {
        physical,
        streaming: streaming
          .filter((s) => s.service.trim())
          .map((s) => ({ service: s.service.trim(), price: s.price, paid: s.price ? undefined : s.paid })),
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-slate-700 bg-slate-900 p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">
            {initial ? 'Edit' : 'Add'} {kind === 'movie' ? 'movie' : 'TV show'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        <div className="mb-3 flex overflow-hidden rounded border border-slate-600 text-sm">
          {(['movie', 'tv'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k)
                setTmdbResults(null)
                setTmdbError(null)
              }}
              className={`flex-1 py-1.5 font-medium ${
                kind === k ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {k === 'movie' ? '🎬 Movie' : '📺 TV Show'}
            </button>
          ))}
        </div>

        {initial ? <p className="mb-3 text-xs text-slate-500">Last updated {formatDate(initial.updatedAt)}</p> : null}

        {stats && (stats.timesWatched > 0 || stats.timesShortlisted > 0) ? (
          <div className="mb-3 rounded bg-slate-800 p-2 text-xs text-slate-400">
            Watched {stats.timesWatched}× · Shortlisted {stats.timesShortlisted}×
            {stats.lastWatchedDate ? ` · Last watched ${formatDate(stats.lastWatchedDate)}` : ''}
          </div>
        ) : null}

        {apiKey ? (
          <div className="mb-3 rounded border border-slate-700 bg-slate-800/60 p-2">
            <div className="flex gap-2">
              <input
                value={tmdbQuery}
                onChange={(e) => setTmdbQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runTmdbSearch()
                  }
                }}
                placeholder={`Search TMDb ${kind === 'movie' ? 'movies' : 'TV shows'} to autofill...`}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={runTmdbSearch}
                disabled={tmdbBusy !== null || !tmdbQuery.trim()}
                className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-40"
              >
                {tmdbBusy === 'search' ? '…' : 'Search'}
              </button>
            </div>
            {tmdbError ? <p className="mt-2 text-xs text-red-400">{tmdbError}</p> : null}
            {providerNote ? <p className="mt-2 text-xs text-slate-400">{providerNote}</p> : null}
            {tmdbResults ? (
              tmdbResults.length === 0 ? (
                <p className="mt-2 text-xs text-slate-500">No results.</p>
              ) : (
                <div className="mt-2 flex max-h-56 flex-col gap-1 overflow-y-auto">
                  {tmdbResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={tmdbBusy !== null}
                      onClick={() => applyTmdbResult(r)}
                      className="flex items-center gap-2 rounded px-1 py-1 text-left text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                    >
                      <span className="flex h-12 w-8 flex-none items-center justify-center overflow-hidden rounded bg-slate-900 text-[10px] text-slate-500">
                        {r.posterUrl ? <img src={r.posterUrl} alt="" className="h-full w-full object-cover" /> : '—'}
                      </span>
                      <span>
                        {r.title} {r.year ? <span className="text-slate-400">({r.year})</span> : null}
                      </span>
                    </button>
                  ))}
                </div>
              )
            ) : null}
            <p className="mt-2 text-[11px] text-slate-500">
              Streaming availability data provided by{' '}
              <a
                href="https://www.justwatch.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-slate-300"
              >
                JustWatch
              </a>
              .
            </p>
          </div>
        ) : (
          <p className="mb-3 text-xs text-slate-500">Add a TMDb API key in Settings to search and autofill.</p>
        )}

        <div className="flex flex-col gap-3">
          <Field label="Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          {duplicate ? (
            <p className="-mt-2 text-xs text-amber-400">
              ⚠ You already have "{duplicate.title}" {duplicate.year ? `(${duplicate.year})` : ''} in your library.
            </p>
          ) : null}
          <div className="flex gap-3">
            <Field label="Year" className="w-24">
              <input value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
            <Field label={kind === 'movie' ? 'Runtime (min)' : 'Episode runtime (min)'} className="w-32">
              <input value={runtime} onChange={(e) => setRuntime(e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
          </div>
          <Field label="Genres (comma separated)">
            <input value={genres} onChange={(e) => setGenres(e.target.value)} className={inputCls} placeholder="Action, Comedy" />
          </Field>
          <Field label="Tags (comma separated)">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={inputCls}
              placeholder="Date night, background noise"
            />
          </Field>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Rating sources</span>
              <span className="text-xs text-slate-400">
                {previewRating !== null ? `→ ${previewRating}/5` : 'no sources yet'}
              </span>
            </div>
            <div className="flex gap-3">
              {RATING_SOURCES.map((def) => (
                <Field key={def.id} label={`${def.label} (0-${def.max})`} className="flex-1">
                  <input
                    value={ratingInputs[def.id] ?? ''}
                    onChange={(e) => setRatingInputs((prev) => ({ ...prev, [def.id]: e.target.value }))}
                    className={inputCls}
                    inputMode="decimal"
                  />
                </Field>
              ))}
            </div>
          </div>

          <Field label="Poster URL">
            <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} className={inputCls} />
          </Field>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Physical copies</span>
              <button type="button" onClick={addPhysicalCopy} className="text-xs text-emerald-400 hover:underline">
                + Add copy
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {physical.map((copy, idx) => (
                <div key={idx} className="flex gap-2">
                  <select
                    value={copy.format}
                    onChange={(e) => updatePhysicalCopy(idx, { format: e.target.value as PhysicalFormat })}
                    className={`${inputCls} w-32`}
                  >
                    {PHYSICAL_FORMATS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                  <input
                    value={copy.location ?? ''}
                    onChange={(e) => updatePhysicalCopy(idx, { location: e.target.value })}
                    placeholder="Shelf / location"
                    className={`${inputCls} flex-1`}
                  />
                  <button type="button" onClick={() => removePhysicalCopy(idx)} className="px-2 text-slate-400 hover:text-red-400">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Streaming services</span>
              <button type="button" onClick={addStreaming} className="text-xs text-emerald-400 hover:underline">
                + Add service
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {streaming.map((entry, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    value={entry.service}
                    onChange={(e) => updateStreaming(idx, { service: e.target.value })}
                    placeholder="Netflix"
                    className={`${inputCls} flex-1`}
                  />
                  <input
                    value={entry.price?.toString() ?? ''}
                    onChange={(e) =>
                      updateStreaming(idx, {
                        price: e.target.value ? Number(e.target.value) : undefined,
                        paid: e.target.value ? undefined : entry.paid,
                      })
                    }
                    placeholder={entry.paid ? 'Paid, $?' : 'Free'}
                    inputMode="decimal"
                    className={`${inputCls} w-24`}
                  />
                  <button type="button" onClick={() => removeStreaming(idx)} className="px-2 text-slate-400 hover:text-red-400">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputCls} h-16 resize-none`} />
          </Field>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${title}"? This can't be undone.`)) onDelete()
              }}
              className="rounded px-3 py-2 text-sm text-red-400 hover:bg-red-950"
            >
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// No width utility here on purpose: callers that need a specific width append
// their own (flex-1, w-24, ...); plain Field usages get it for free from the
// parent label's flex-col stretch. Combining this with w-full caused the
// width utilities to fight (see the physical-copy/streaming rows).
const inputCls =
  'rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500'

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}
