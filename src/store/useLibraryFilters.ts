import { useEffect, useState } from 'react'
import { DEFAULT_FILTERS } from '../components/FilterBar'
import type { Filters } from '../components/FilterBar'

const KEY = 'movie-picker:library-filters'

function loadFilters(): Filters {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_FILTERS
    // Spread over the defaults so a filter added in a later version doesn't
    // come back `undefined` for someone with an older saved value.
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_FILTERS
  }
}

/** Keeps your search/filter setup as you move between tabs, and across reloads. */
export function useLibraryFilters() {
  const [filters, setFilters] = useState<Filters>(() => loadFilters())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(filters))
  }, [filters])

  return [filters, setFilters] as const
}
