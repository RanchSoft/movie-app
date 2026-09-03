export type PhysicalFormat = 'DVD' | 'Blu-ray' | '4K UHD' | 'VHS' | 'Digital Copy'

export interface PhysicalCopy {
  format: PhysicalFormat
  location?: string
}

export interface StreamingAvailability {
  service: string
  /** USD. Omitted/undefined means free (included with a subscription you already have). */
  price?: number
}

export interface Availability {
  physical: PhysicalCopy[]
  streaming: StreamingAvailability[]
}

export interface Movie {
  id: string
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
