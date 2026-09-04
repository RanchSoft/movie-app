import { useLibrary } from '../store/LibraryContext'
import { useLastBackup } from '../store/useLastBackup'
import { useDismissedAt } from '../store/useDismissedAt'
import { exportLibraryFile } from '../store/storage'
import { daysSince, formatRelativeTime } from '../utils/format'

const STALE_AFTER_DAYS = 14
const SNOOZE_DAYS = 7
const MIN_MOVIES_TO_NAG = 5

export function BackupReminderBanner() {
  const { movies, sessions } = useLibrary()
  const { lastBackupAt, recordBackup } = useLastBackup()
  const { dismissedAt, dismiss } = useDismissedAt('backup-reminder')

  const stale = lastBackupAt ? daysSince(lastBackupAt) >= STALE_AFTER_DAYS : movies.length >= MIN_MOVIES_TO_NAG
  const recentlyDismissed = dismissedAt ? daysSince(dismissedAt) < SNOOZE_DAYS : false

  if (!stale || recentlyDismissed) return null

  const handleExport = () => {
    exportLibraryFile({ version: 1, movies, sessions })
    recordBackup()
  }

  return (
    <div className="mx-3 mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-sm text-amber-200 sm:mx-4">
      <p>
        {lastBackupAt
          ? `Your last backup was ${formatRelativeTime(lastBackupAt)}.`
          : "You haven't exported a backup yet."}{' '}
        Your library only lives in this browser's storage.
      </p>
      <div className="flex flex-none items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          className="rounded bg-amber-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-600"
        >
          Export now
        </button>
        <button type="button" onClick={dismiss} title="Remind me later" className="text-amber-400 hover:text-amber-200">
          ✕
        </button>
      </div>
    </div>
  )
}
