export type PhysicalFormat = 'DVD' | 'Blu-ray' | '4K UHD' | 'VHS' | 'Digital Copy'

export interface PhysicalCopy {
  format: PhysicalFormat
  location?: string
}

export interface Availability {
  physical: PhysicalCopy[]
  streaming: string[]
}

export interface Movie {
  id: string
  title: string
  year?: number
  genres: string[]
  runtimeMinutes?: number
  ratingSources: Partial<Record<string, number>>
  posterUrl?: string
  notes?: string
  availability: Availability
  addedAt: string
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
