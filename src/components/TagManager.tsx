import { useMemo, useState } from 'react'
import { useLibrary } from '../store/LibraryContext'

export function TagManager() {
  const { movies, renameTag, deleteTag } = useLibrary()
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const tags = useMemo(() => {
    const counts = new Map<string, number>()
    for (const movie of movies) {
      for (const tag of movie.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [movies])

  const startEdit = (tag: string) => {
    setEditing(tag)
    setDraft(tag)
  }

  const saveEdit = (tag: string) => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== tag) renameTag(tag, trimmed)
    setEditing(null)
  }

  const handleDelete = (tag: string, count: number) => {
    if (confirm(`Remove tag "${tag}" from ${count} title${count === 1 ? '' : 's'}? This can't be undone.`)) {
      deleteTag(tag)
    }
  }

  if (tags.length === 0) {
    return <p className="mt-3 text-xs text-slate-500">No tags yet — they'll show up here once you tag some titles.</p>
  }

  return (
    <div className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
      {tags.map(([tag, count]) => (
        <div key={tag} className="flex items-center gap-2 rounded px-1 py-1 hover:bg-slate-800/60">
          {editing === tag ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    saveEdit(tag)
                  }
                  if (e.key === 'Escape') setEditing(null)
                }}
                autoFocus
                className="flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={() => saveEdit(tag)}
                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-100 hover:bg-slate-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-slate-200">
                {tag} <span className="text-xs text-slate-500">({count})</span>
              </span>
              <button
                type="button"
                onClick={() => startEdit(tag)}
                className="text-xs text-emerald-400 hover:underline"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tag, count)}
                className="text-xs text-slate-500 hover:text-red-400"
              >
                Delete
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
