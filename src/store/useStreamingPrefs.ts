import { useCallback, useEffect, useState } from 'react'

const SERVICES_KEY = 'movie-picker:my-services'
const REGION_KEY = 'movie-picker:region'
const DEFAULT_REGION = 'US'

function loadServices(): string[] {
  try {
    const raw = localStorage.getItem(SERVICES_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

/** Which services you have accounts on, and which region's TMDb watch-provider data to use. Local only. */
export function useStreamingPrefs() {
  const [services, setServicesState] = useState<string[]>(() => loadServices())
  const [region, setRegionState] = useState<string>(() => localStorage.getItem(REGION_KEY) ?? DEFAULT_REGION)

  useEffect(() => {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(services))
  }, [services])

  useEffect(() => {
    localStorage.setItem(REGION_KEY, region)
  }, [region])

  const setServices = useCallback((value: string[]) => {
    setServicesState(Array.from(new Set(value.map((s) => s.trim()).filter(Boolean))))
  }, [])

  const setRegion = useCallback((value: string) => {
    setRegionState(value.trim().toUpperCase() || DEFAULT_REGION)
  }, [])

  return { services, setServices, region, setRegion }
}
