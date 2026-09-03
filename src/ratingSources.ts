export interface RatingSourceDef {
  id: string
  label: string
  max: number
  step: number
}

// To add a new rating source, just add an entry here — the form, the
// aggregate computation, and sorting all pick it up automatically.
export const RATING_SOURCES: RatingSourceDef[] = [
  { id: 'letterboxd', label: 'Letterboxd', max: 5, step: 0.1 },
  { id: 'rottenTomatoesCritic', label: 'Rotten Tomatoes (critic)', max: 100, step: 1 },
]

export type RatingSources = Partial<Record<string, number>>

/** Averages whichever known sources are present, each normalized to a 0-5 scale, equally weighted. */
export function computeRating(sources: RatingSources | undefined): number | null {
  if (!sources) return null
  const normalized: number[] = []
  for (const def of RATING_SOURCES) {
    const raw = sources[def.id]
    if (raw === undefined || raw === null || Number.isNaN(raw)) continue
    normalized.push((raw / def.max) * 5)
  }
  if (normalized.length === 0) return null
  const avg = normalized.reduce((a, b) => a + b, 0) / normalized.length
  return Math.round(avg * 10) / 10
}
