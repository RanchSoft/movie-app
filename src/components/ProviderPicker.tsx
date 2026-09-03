import { useEffect, useState } from 'react'
import { getAllProviders } from '../tmdb'
import type { TmdbProviderListing } from '../tmdb'
import { parseTagList } from '../utils/format'

interface Props {
  apiKey: string
  region: string
  selected: string[]
  onChange: (services: string[]) => void
}

export function ProviderPicker({ apiKey, region, selected, onChange }: Props) {
  const [providers, setProviders] = useState<TmdbProviderListing[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [customDraft, setCustomDraft] = useState('')

  useEffect(() => {
    if (!apiKey) {
      setProviders(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getAllProviders(apiKey, region)
      .then((list) => {
        if (!cancelled) setProviders(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiKey, region])

  const selectedLower = new Set(selected.map((s) => s.toLowerCase()))
  const toggle = (name: string) => {
    if (selectedLower.has(name.toLowerCase())) {
      onChange(selected.filter((s) => s.toLowerCase() !== name.toLowerCase()))
    } else {
      onChange([...selected, name])
    }
  }
  const remove = (name: string) => onChange(selected.filter((s) => s !== name))
  const addCustom = () => {
    const additions = parseTagList(customDraft).filter((s) => !selectedLower.has(s.toLowerCase()))
    if (additions.length > 0) onChange([...selected, ...additions])
    setCustomDraft('')
  }

  const filtered = (providers ?? []).filter((p) => p.name.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-emerald-900/50 py-0.5 pl-2 pr-1 text-xs text-emerald-300"
            >
              {s}
              <button type="button" onClick={() => remove(s)} className="text-emerald-400 hover:text-emerald-100">
                ✕
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500">No services selected yet.</p>
      )}

      {apiKey ? (
        <div className="rounded border border-slate-600 bg-slate-800">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={loading ? 'Loading providers…' : `Search providers in ${region}...`}
            disabled={loading}
            className="w-full border-b border-slate-600 bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-60"
          />
          {error ? (
            <p className="p-2 text-xs text-red-400">{error}</p>
          ) : (
            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.length === 0 && !loading ? (
                <p className="p-2 text-xs text-slate-500">No matches.</p>
              ) : (
                filtered.map((p) => (
                  <label
                    key={p.name}
                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-slate-200 hover:bg-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLower.has(p.name.toLowerCase())}
                      onChange={() => toggle(p.name)}
                      className="accent-emerald-600"
                    />
                    <span className="flex h-5 w-5 flex-none items-center justify-center overflow-hidden rounded bg-slate-900">
                      {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-full w-full object-cover" /> : null}
                    </span>
                    {p.name}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-slate-500">Add a TMDb API key above to pick from the official provider list.</p>
      )}

      <div className="flex gap-2">
        <input
          value={customDraft}
          onChange={(e) => setCustomDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder="Add a service not listed above..."
          className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customDraft.trim()}
          className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600 disabled:opacity-40"
        >
          + Add
        </button>
      </div>
    </div>
  )
}
