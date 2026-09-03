import type { MovieKind } from './types'

const API_BASE = 'https://api.themoviedb.org/3'
const POSTER_BASE = 'https://image.tmdb.org/t/p/w342'
const LOGO_BASE = 'https://image.tmdb.org/t/p/w45'

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

export type TmdbProviderCategory = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'

export interface TmdbProvider {
  name: string
  category: TmdbProviderCategory
}

/**
 * TMDb's watch/providers endpoint (JustWatch-sourced) lists which services carry a title
 * per region, and under what access type — it does NOT include actual rental/purchase
 * prices, just the provider name and category.
 */
export async function getWatchProviders(
  apiKey: string,
  id: number,
  kind: MovieKind,
  region: string,
): Promise<TmdbProvider[]> {
  const path = kind === 'movie' ? `/movie/${id}/watch/providers` : `/tv/${id}/watch/providers`
  const data = (await tmdbFetch(path, apiKey)) as {
    results: Record<string, Partial<Record<TmdbProviderCategory, { provider_name: string }[]>>>
  }
  const regionData = data.results[region.toUpperCase()]
  if (!regionData) return []

  const categories: TmdbProviderCategory[] = ['flatrate', 'free', 'ads', 'rent', 'buy']
  const providers: TmdbProvider[] = []
  for (const category of categories) {
    for (const p of regionData[category] ?? []) {
      providers.push({ name: p.provider_name, category })
    }
  }
  return providers
}

export interface TmdbProviderListing {
  name: string
  logoUrl?: string
  /** Lower is more prominent in this region — used to sort the picker so the big names show first. */
  priority: number
}

/**
 * The full catalog of providers TMDb knows about for this region, for picking "which services
 * do you have" from an authoritative list instead of typing names that might not match exactly.
 * Movie and TV provider lists overlap heavily but aren't identical, so both are fetched and merged.
 */
export async function getAllProviders(apiKey: string, region: string): Promise<TmdbProviderListing[]> {
  const regionUpper = region.toUpperCase()
  const fetchOne = async (kind: MovieKind) => {
    const path = kind === 'movie' ? '/watch/providers/movie' : '/watch/providers/tv'
    const data = (await tmdbFetch(`${path}?watch_region=${regionUpper}`, apiKey)) as {
      results: { provider_name: string; logo_path?: string | null; display_priorities?: Record<string, number> }[]
    }
    return data.results.map((p) => ({
      name: p.provider_name,
      logoUrl: p.logo_path ? `${LOGO_BASE}${p.logo_path}` : undefined,
      priority: p.display_priorities?.[regionUpper] ?? 999,
    }))
  }

  const [movieProviders, tvProviders] = await Promise.all([fetchOne('movie'), fetchOne('tv')])
  const byName = new Map<string, TmdbProviderListing>()
  for (const p of [...movieProviders, ...tvProviders]) {
    const existing = byName.get(p.name)
    if (!existing || p.priority < existing.priority) byName.set(p.name, p)
  }
  return Array.from(byName.values()).sort((a, b) => a.priority - b.priority)
}
