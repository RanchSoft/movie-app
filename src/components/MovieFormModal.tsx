import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Movie, MovieStats, PhysicalCopy, PhysicalFormat } from '../types'
import { parseTagList, formatDate } from '../utils/format'
import { computeRating, RATING_SOURCES } from '../ratingSources'

const PHYSICAL_FORMATS: PhysicalFormat[] = ['DVD', 'Blu-ray', '4K UHD', 'VHS', 'Digital Copy']

interface Props {
  initial: Movie | null
  stats: MovieStats | null
  onSave: (movie: Omit<Movie, 'id' | 'addedAt'>) => void
  onDelete?: () => void
  onClose: () => void
}

export function MovieFormModal({ initial, stats, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [year, setYear] = useState(initial?.year?.toString() ?? '')
  const [genres, setGenres] = useState(initial?.genres.join(', ') ?? '')
  const [runtime, setRuntime] = useState(initial?.runtimeMinutes?.toString() ?? '')
  const [ratingInputs, setRatingInputs] = useState<Record<string, string>>(() => {
    const entries = RATING_SOURCES.map((def) => [def.id, initial?.ratingSources[def.id]?.toString() ?? ''])
    return Object.fromEntries(entries)
  })
  const [posterUrl, setPosterUrl] = useState(initial?.posterUrl ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [streaming, setStreaming] = useState(initial?.availability.streaming.join(', ') ?? '')
  const [physical, setPhysical] = useState<PhysicalCopy[]>(initial?.availability.physical ?? [])

  const addPhysicalCopy = () => setPhysical((p) => [...p, { format: 'Blu-ray' }])
  const updatePhysicalCopy = (idx: number, updates: Partial<PhysicalCopy>) =>
    setPhysical((p) => p.map((c, i) => (i === idx ? { ...c, ...updates } : c)))
  const removePhysicalCopy = (idx: number) => setPhysical((p) => p.filter((_, i) => i !== idx))

  const canSave = title.trim().length > 0

  const ratingSources = Object.fromEntries(
    Object.entries(ratingInputs)
      .filter(([, v]) => v.trim() !== '')
      .map(([k, v]) => [k, Number(v)]),
  )
  const previewRating = computeRating(ratingSources)

  const handleSave = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      year: year ? Number(year) : undefined,
      genres: parseTagList(genres),
      runtimeMinutes: runtime ? Number(runtime) : undefined,
      ratingSources,
      posterUrl: posterUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      availability: { physical, streaming: parseTagList(streaming) },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-slate-700 bg-slate-900 p-4 sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{initial ? 'Edit movie' : 'Add movie'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            ✕
          </button>
        </div>

        {stats && (stats.timesWatched > 0 || stats.timesShortlisted > 0) ? (
          <div className="mb-3 rounded bg-slate-800 p-2 text-xs text-slate-400">
            Watched {stats.timesWatched}× · Shortlisted {stats.timesShortlisted}×
            {stats.lastWatchedDate ? ` · Last watched ${formatDate(stats.lastWatchedDate)}` : ''}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Field label="Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex gap-3">
            <Field label="Year" className="w-24">
              <input value={year} onChange={(e) => setYear(e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
            <Field label="Runtime (min)" className="w-32">
              <input value={runtime} onChange={(e) => setRuntime(e.target.value)} className={inputCls} inputMode="numeric" />
            </Field>
          </div>
          <Field label="Genres (comma separated)">
            <input value={genres} onChange={(e) => setGenres(e.target.value)} className={inputCls} placeholder="Action, Comedy" />
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

          <Field label="Streaming services (comma separated)">
            <input value={streaming} onChange={(e) => setStreaming(e.target.value)} className={inputCls} placeholder="Netflix, Max" />
          </Field>

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

const inputCls =
  'w-full rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500'

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ''}`}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}
