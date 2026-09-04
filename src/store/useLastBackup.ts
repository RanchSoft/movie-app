import { useCallback, useState } from 'react'

const KEY = 'movie-picker:last-backup-at'

/** Tracks when the user last exported a JSON backup, so we can nudge them if it's been a while. */
export function useLastBackup() {
  const [lastBackupAt, setLastBackupAtState] = useState<string | null>(() => localStorage.getItem(KEY))

  const recordBackup = useCallback(() => {
    const now = new Date().toISOString()
    localStorage.setItem(KEY, now)
    setLastBackupAtState(now)
  }, [])

  return { lastBackupAt, recordBackup }
}
