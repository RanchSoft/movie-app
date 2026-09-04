import type { Movie } from './types'
import { formatRuntime } from './utils/format'

export interface TiebreakerDef {
  id: string
  label: string
  icon: string
  getValue: (m: Movie) => number | string | null | undefined
  /** true = the highest value wins (e.g. newest, longest); false = the lowest value wins (e.g. oldest, shortest, first alphabetically). */
  betterIsHigher: boolean
  describe: (m: Movie) => string
}

// To add a new tiebreaker, just add an entry here — random selection and the
// reveal UI pick it up automatically.
export const TIEBREAKERS: TiebreakerDef[] = [
  {
    id: 'alphabetical',
    label: 'Alphabetical',
    icon: '🔤',
    getValue: (m) => m.title.toLowerCase(),
    betterIsHigher: false,
    describe: (m) => `${m.title} comes first alphabetically`,
  },
  {
    id: 'shortest',
    label: 'Shortest runtime',
    icon: '⏱️',
    getValue: (m) => m.runtimeMinutes ?? null,
    betterIsHigher: false,
    describe: (m) => `${m.title} has the shortest runtime (${formatRuntime(m.runtimeMinutes)})`,
  },
  {
    id: 'longest',
    label: 'Longest runtime',
    icon: '⏳',
    getValue: (m) => m.runtimeMinutes ?? null,
    betterIsHigher: true,
    describe: (m) => `${m.title} has the longest runtime (${formatRuntime(m.runtimeMinutes)})`,
  },
  {
    id: 'letterboxd',
    label: 'Highest Letterboxd score',
    icon: '🎞️',
    getValue: (m) => m.ratingSources?.letterboxd ?? null,
    betterIsHigher: true,
    describe: (m) => `${m.title} has the highest Letterboxd score (${m.ratingSources?.letterboxd}/5)`,
  },
  {
    id: 'oldest',
    label: 'Oldest',
    icon: '📼',
    getValue: (m) => m.year ?? null,
    betterIsHigher: false,
    describe: (m) => `${m.title} is the oldest (${m.year})`,
  },
  {
    id: 'newest',
    label: 'Newest',
    icon: '✨',
    getValue: (m) => m.year ?? null,
    betterIsHigher: true,
    describe: (m) => `${m.title} is the newest (${m.year})`,
  },
]

export const COIN_FLIP: TiebreakerDef = {
  id: 'coin-flip',
  label: 'Coin flip',
  icon: '🪙',
  getValue: () => null,
  betterIsHigher: false,
  describe: (m) => `${m.title} won the coin flip`,
}

/**
 * Applies a tiebreaker to a set of tied movies. Returns the sole winner, or
 * null if the method can't be applied (missing data) or doesn't produce a
 * unique winner (still tied under this method too).
 */
export function resolveTiebreaker(tied: Movie[], def: TiebreakerDef): Movie | null {
  const withValue = tied
    .map((m) => ({ m, v: def.getValue(m) }))
    .filter((x): x is { m: Movie; v: number | string } => x.v !== null && x.v !== undefined)
  if (withValue.length === 0) return null

  const sorted = [...withValue].sort((a, b) => {
    if (typeof a.v === 'string' && typeof b.v === 'string') {
      return def.betterIsHigher ? b.v.localeCompare(a.v) : a.v.localeCompare(b.v)
    }
    const an = a.v as number
    const bn = b.v as number
    return def.betterIsHigher ? bn - an : an - bn
  })
  const bestValue = sorted[0].v
  const atBest = sorted.filter((x) => x.v === bestValue)
  return atBest.length === 1 ? atBest[0].m : null
}

export interface TiebreakChoice {
  method: TiebreakerDef
  winner: Movie
}

/** Randomly picks a tiebreaker that can actually resolve this specific tie; falls back to a coin flip. */
export function pickRandomTiebreak(tied: Movie[]): TiebreakChoice {
  const candidates = TIEBREAKERS.map((method) => ({ method, winner: resolveTiebreaker(tied, method) })).filter(
    (c): c is TiebreakChoice => c.winner !== null,
  )
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
  const winner = tied[Math.floor(Math.random() * tied.length)]
  return { method: COIN_FLIP, winner }
}
