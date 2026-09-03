import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { nanoid } from 'nanoid'
import type { LibraryData, Movie, MovieStats, WatchSession } from '../types'
import { loadLibrary, saveLibrary } from './storage'

interface LibraryContextValue {
  movies: Movie[]
  sessions: WatchSession[]
  addMovie: (movie: Omit<Movie, 'id' | 'addedAt' | 'updatedAt'>) => Movie
  updateMovie: (id: string, updates: Partial<Omit<Movie, 'id' | 'addedAt' | 'updatedAt'>>) => void
  deleteMovie: (id: string) => void
  addSession: (session: Omit<WatchSession, 'id'>) => WatchSession
  deleteSession: (id: string) => void
  statsFor: (movieId: string) => MovieStats
  replaceAll: (data: LibraryData) => void
}

const LibraryContext = createContext<LibraryContextValue | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LibraryData>(() => loadLibrary())

  useEffect(() => {
    saveLibrary(data)
  }, [data])

  const value = useMemo<LibraryContextValue>(() => {
    const statsByMovie = new Map<string, MovieStats>()
    for (const session of data.sessions) {
      for (const movieId of session.shortlistMovieIds) {
        const existing = statsByMovie.get(movieId) ?? {
          timesWatched: 0,
          timesShortlisted: 0,
          lastWatchedDate: null,
        }
        existing.timesShortlisted += 1
        statsByMovie.set(movieId, existing)
      }
      if (session.pickedMovieId) {
        const existing = statsByMovie.get(session.pickedMovieId) ?? {
          timesWatched: 0,
          timesShortlisted: 0,
          lastWatchedDate: null,
        }
        existing.timesWatched += 1
        if (!existing.lastWatchedDate || session.date > existing.lastWatchedDate) {
          existing.lastWatchedDate = session.date
        }
        statsByMovie.set(session.pickedMovieId, existing)
      }
    }

    return {
      movies: data.movies,
      sessions: data.sessions,
      addMovie: (movie) => {
        const now = new Date().toISOString()
        const newMovie: Movie = { ...movie, id: nanoid(), addedAt: now, updatedAt: now }
        setData((prev) => ({ ...prev, movies: [...prev.movies, newMovie] }))
        return newMovie
      },
      updateMovie: (id, updates) => {
        setData((prev) => ({
          ...prev,
          movies: prev.movies.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m,
          ),
        }))
      },
      deleteMovie: (id) => {
        setData((prev) => ({
          ...prev,
          movies: prev.movies.filter((m) => m.id !== id),
          sessions: prev.sessions.map((s) => ({
            ...s,
            shortlistMovieIds: s.shortlistMovieIds.filter((mid) => mid !== id),
            pickedMovieId: s.pickedMovieId === id ? null : s.pickedMovieId,
          })),
        }))
      },
      addSession: (session) => {
        const newSession: WatchSession = { ...session, id: nanoid() }
        setData((prev) => ({ ...prev, sessions: [...prev.sessions, newSession] }))
        return newSession
      },
      deleteSession: (id) => {
        setData((prev) => ({ ...prev, sessions: prev.sessions.filter((s) => s.id !== id) }))
      },
      statsFor: (movieId) =>
        statsByMovie.get(movieId) ?? { timesWatched: 0, timesShortlisted: 0, lastWatchedDate: null },
      replaceAll: (newData) => setData(newData),
    }
  }, [data])

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within a LibraryProvider')
  return ctx
}
