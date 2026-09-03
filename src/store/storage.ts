import type { LibraryData } from '../types'
import { normalizeMovie, normalizeSession } from './normalize'

const STORAGE_KEY = 'movie-picker:library'
const CURRENT_VERSION = 1

export function loadLibrary(): LibraryData {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { version: CURRENT_VERSION, movies: [], sessions: [] }
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LibraryData>
    return {
      version: CURRENT_VERSION,
      movies: (parsed.movies ?? []).map(normalizeMovie),
      sessions: (parsed.sessions ?? []).map(normalizeSession),
    }
  } catch {
    console.error('Failed to parse stored library data, starting fresh.')
    return { version: CURRENT_VERSION, movies: [], sessions: [] }
  }
}

export function saveLibrary(data: LibraryData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function exportLibraryFile(data: LibraryData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `movie-library-${date}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Accepts either a full export (movies + sessions) or a hand-written file
 * that's just `{ "movies": [...] }` — titles are the only required field,
 * ids/addedAt/arrays are filled in automatically.
 */
export function parseImportedLibrary(text: string): LibraryData {
  const parsed = JSON.parse(text) as Partial<LibraryData>
  if (!Array.isArray(parsed.movies)) {
    throw new Error('File does not look like a movie library — expected a top-level "movies" array.')
  }
  return {
    version: CURRENT_VERSION,
    movies: parsed.movies.map(normalizeMovie),
    sessions: (parsed.sessions ?? []).map(normalizeSession),
  }
}
