import { nanoid } from 'nanoid'
import type { Movie, StreamingAvailability, WatchSession } from '../types'

/** Accepts the old `streaming: string[]` shape as well as the current `{ service, price? }[]` shape. */
function normalizeStreamingEntry(raw: unknown): StreamingAvailability | null {
  if (typeof raw === 'string') {
    const service = raw.trim()
    return service ? { service } : null
  }
  if (raw && typeof raw === 'object' && typeof (raw as { service?: unknown }).service === 'string') {
    const service = (raw as { service: string }).service.trim()
    if (!service) return null
    const rawPrice = (raw as { price?: unknown }).price
    const price = typeof rawPrice === 'number' && Number.isFinite(rawPrice) ? rawPrice : undefined
    const paid = (raw as { paid?: unknown }).paid === true ? true : undefined
    return { service, price, paid }
  }
  return null
}

/**
 * Fills in whatever a hand-written movie entry leaves out (id, addedAt, arrays)
 * so a JSON file only needs a `title` to be valid. Existing ids are preserved
 * as-is since watch sessions reference movies by id.
 */
export function normalizeMovie(raw: Partial<Movie>): Movie {
  if (!raw.title || typeof raw.title !== 'string') {
    throw new Error('Every movie needs a "title".')
  }
  const addedAt = raw.addedAt && typeof raw.addedAt === 'string' ? raw.addedAt : new Date().toISOString()
  return {
    id: raw.id && typeof raw.id === 'string' ? raw.id : nanoid(),
    kind: raw.kind === 'tv' ? 'tv' : 'movie',
    title: raw.title,
    year: raw.year,
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    runtimeMinutes: raw.runtimeMinutes,
    ratingSources: raw.ratingSources && typeof raw.ratingSources === 'object' ? raw.ratingSources : {},
    posterUrl: raw.posterUrl,
    notes: raw.notes,
    availability: {
      physical: Array.isArray(raw.availability?.physical) ? raw.availability.physical : [],
      streaming: Array.isArray(raw.availability?.streaming)
        ? raw.availability.streaming.map(normalizeStreamingEntry).filter((s): s is StreamingAvailability => s !== null)
        : [],
    },
    addedAt,
    updatedAt: raw.updatedAt && typeof raw.updatedAt === 'string' ? raw.updatedAt : addedAt,
  }
}

export function normalizeSession(raw: Partial<WatchSession>): WatchSession {
  return {
    id: raw.id && typeof raw.id === 'string' ? raw.id : nanoid(),
    date: raw.date && typeof raw.date === 'string' ? raw.date : new Date().toISOString().slice(0, 10),
    shortlistMovieIds: Array.isArray(raw.shortlistMovieIds) ? raw.shortlistMovieIds : [],
    pickedMovieId: raw.pickedMovieId ?? null,
    pickMethod: raw.pickMethod ?? null,
    attendees: Array.isArray(raw.attendees) ? raw.attendees : [],
    notes: raw.notes,
  }
}
