export type PhysicalFormat = 'DVD' | 'Blu-ray' | '4K UHD' | 'VHS' | 'Digital Copy'

export interface PhysicalCopy {
  format: PhysicalFormat
  location?: string
}

export interface StreamingAvailability {
  service: string
  /** USD. Omitted/undefined means free (included with a subscription you already have). */
  price?: number
  /** True = known to require rental/purchase but the exact price isn't known (e.g. from TMDb's watch-providers data, which lists providers, not prices). Ignored once `price` is set. */
  paid?: boolean
}

export interface Availability {
  physical: PhysicalCopy[]
  streaming: StreamingAvailability[]
}

export type MovieKind = 'movie' | 'tv'

/** Despite the name, this also covers TV shows (see `kind`) — no episode-level tracking, a show is just a library entry like a movie. */
export interface Movie {
  id: string
  kind: MovieKind
  title: string
  year?: number
  genres: string[]
  /** Free-form, e.g. "date night", "background noise" — separate from genre. */
  tags: string[]
  runtimeMinutes?: number
  ratingSources: Partial<Record<string, number>>
  posterUrl?: string
  notes?: string
  availability: Availability
  addedAt: string
  updatedAt: string
}

export type PickMethod = 'random' | 'manual'

export interface WatchSession {
  id: string
  date: string
  shortlistMovieIds: string[]
  pickedMovieId: string | null
  pickMethod: PickMethod | null
  attendees: string[]
  notes?: string
}

export interface LibraryData {
  version: 1
  movies: Movie[]
  sessions: WatchSession[]
}

export interface MovieStats {
  timesWatched: number
  timesShortlisted: number
  lastWatchedDate: string | null
}
