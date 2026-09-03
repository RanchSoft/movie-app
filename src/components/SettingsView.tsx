import { useRef, useState } from 'react'
import { useLibrary } from '../store/LibraryContext'
import { exportLibraryFile, parseImportedLibrary } from '../store/storage'
import { useTmdbKey } from '../store/useTmdbKey'

export function SettingsView() {
  const { movies, sessions, replaceAll } = useLibrary()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { apiKey, setApiKey } = useTmdbKey()
  const [keyDraft, setKeyDraft] = useState(apiKey)
  const [keySaved, setKeySaved] = useState(false)

  const handleExport = () => {
    exportLibraryFile({ version: 1, movies, sessions })
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = parseImportedLibrary(text)
      const mode = confirm(
        `Import ${data.movies.length} movies and ${data.sessions.length} sessions.\n\nOK = replace everything currently stored.\nCancel = do nothing.`,
      )
      if (mode) replaceAll(data)
    } catch (err) {
      alert(`Could not import file: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleClearAll = () => {
    if (confirm('Erase all movies and history on this device? Export a backup first if unsure.')) {
      replaceAll({ version: 1, movies: [], sessions: [] })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-slate-100">Settings</h1>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <h2 className="font-medium text-slate-100">Backup & sync</h2>
        <p className="mt-1 text-sm text-slate-400">
          Data lives only on this device's browser storage. Export a JSON file to back it up, move it to another
          device, or hand-edit it. Importing replaces everything currently stored here.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="rounded bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-600"
          >
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
        <h2 className="font-medium text-slate-100">TMDb autofill</h2>
        <p className="mt-1 text-sm text-slate-400">
          Add a free API key from{' '}
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline"
          >
            themoviedb.org
          </a>{' '}
          to search and auto-fill title/year/genre/runtime/poster when adding a movie. The key is stored only in
          this browser (localStorage) — it's never committed to the repo or included in the built site.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            value={keyDraft}
            onChange={(e) => {
              setKeyDraft(e.target.value)
              setKeySaved(false)
            }}
            placeholder="TMDb API key"
            className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="button"
            onClick={() => {
              setApiKey(keyDraft)
              setKeySaved(true)
            }}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Save
          </button>
        </div>
        {keySaved ? <p className="mt-1 text-xs text-emerald-400">Saved.</p> : null}
      </div>

      <div className="rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
        <p>{movies.length} movies · {sessions.length} logged movie nights</p>
      </div>

      <div className="rounded-lg border border-red-900 bg-red-950/30 p-4">
        <h2 className="font-medium text-red-300">Danger zone</h2>
        <button
          type="button"
          onClick={handleClearAll}
          className="mt-2 rounded bg-red-900 px-3 py-1.5 text-sm font-medium text-red-100 hover:bg-red-800"
        >
          Erase all data
        </button>
      </div>
    </div>
  )
}
