import type { MovieKind } from './types'

const API_BASE = 'https://api.themoviedb.org/3'
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'

export interface TmdbSearchResult {
  id: number
  title: string
  year?: number
  posterUrl?: string
}

export interface TmdbMovieDetails {
  title: string
  year?: number
  genres: string[]
  runtimeMinutes?: number
  posterUrl?: string
}

async function tmdbFetch(path: string, apiKey: string): Promise<unknown> {
  const url = new URL(`${API_BASE}${path}`)
  url.searchParams.set('api_key', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) {
    if (res.status === 401) throw new Error('TMDb rejected that API key — check it in Settings.')
    throw new Error(`TMDb request failed (${res.status})`)
  }
  return res.json()
}

function yearFromDate(date?: string): number | undefined {
  return date ? Number(date.slice(0, 4)) || undefined : undefined
}

/** TV's `/search/tv` uses `name`/`first_air_date` where movies use `title`/`release_date` — everything else lines up. */
export async function search(apiKey: string, query: string, kind: MovieKind): Promise<TmdbSearchResult[]> {
  const path = kind === 'movie' ? '/search/movie' : '/search/tv'
  const data = (await tmdbFetch(`${path}?query=${encodeURIComponent(query)}`, apiKey)) as {
    results: {
      id: number
      title?: string
      name?: string
      release_date?: string
      first_air_date?: string
      poster_path?: string | null
    }[]
  }
  return data.results.slice(0, 8).map((r) => ({
    id: r.id,
    title: (kind === 'movie' ? r.title : r.name) ?? '',
    year: yearFromDate(kind === 'movie' ? r.release_date : r.first_air_date),
    posterUrl: r.poster_path ? `${POSTER_BASE}${r.poster_path}` : undefined,
  }))
}

/** For TV, `runtimeMinutes` comes from `episode_run_time` (typical episode length, not the whole series). */
export async function getDetails(apiKey: string, id: number, kind: MovieKind): Promise<TmdbMovieDetails> {
  const path = kind === 'movie' ? `/movie/${id}` : `/tv/${id}`
  const data = (await tmdbFetch(path, apiKey)) as {
    title?: string
    name?: string
    release_date?: string
    first_air_date?: string
    genres: { name: string }[]
    runtime?: number
    episode_run_time?: number[]
    poster_path?: string | null
  }
  return {
    title: (kind === 'movie' ? data.title : data.name) ?? '',
    year: yearFromDate(kind === 'movie' ? data.release_date : data.first_air_date),
    genres: data.genres.map((g) => g.name),
    runtimeMinutes: (kind === 'movie' ? data.runtime : data.episode_run_time?.[0]) || undefined,
    posterUrl: data.poster_path ? `${POSTER_BASE}${data.poster_path}` : undefined,
  }
}
