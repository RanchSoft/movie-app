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

export async function searchMovies(apiKey: string, query: string): Promise<TmdbSearchResult[]> {
  const data = (await tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}`, apiKey)) as {
    results: { id: number; title: string; release_date?: string; poster_path?: string | null }[]
  }
  return data.results.slice(0, 8).map((r) => ({
    id: r.id,
    title: r.title,
    year: r.release_date ? Number(r.release_date.slice(0, 4)) || undefined : undefined,
    posterUrl: r.poster_path ? `${POSTER_BASE}${r.poster_path}` : undefined,
  }))
}

export async function getMovieDetails(apiKey: string, id: number): Promise<TmdbMovieDetails> {
  const data = (await tmdbFetch(`/movie/${id}`, apiKey)) as {
    title: string
    release_date?: string
    genres: { name: string }[]
    runtime?: number
    poster_path?: string | null
  }
  return {
    title: data.title,
    year: data.release_date ? Number(data.release_date.slice(0, 4)) || undefined : undefined,
    genres: data.genres.map((g) => g.name),
    runtimeMinutes: data.runtime || undefined,
    posterUrl: data.poster_path ? `${POSTER_BASE}${data.poster_path}` : undefined,
  }
}
