import { useState } from 'react'
import { LibraryProvider } from './store/LibraryContext'
import { useShortlist } from './store/useShortlist'
import { LibraryView } from './components/LibraryView'
import { ShortlistView } from './components/ShortlistView'
import { HistoryView } from './components/HistoryView'
import { StatsView } from './components/StatsView'
import { SettingsView } from './components/SettingsView'

type Tab = 'library' | 'shortlist' | 'history' | 'stats' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'library', label: 'Library', icon: '🎬' },
  { id: 'shortlist', label: 'Shortlist', icon: '📋' },
  { id: 'history', label: 'History', icon: '🕓' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

function AppShell() {
  const [tab, setTab] = useState<Tab>('library')
  const { shortlist, toggle, remove, clear, addMany } = useShortlist()

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col bg-slate-950 pb-20 text-slate-100">
      <main className="flex-1 p-3 sm:p-4">
        {tab === 'library' ? <LibraryView shortlist={shortlist} onToggleShortlist={toggle} /> : null}
        {tab === 'shortlist' ? <ShortlistView shortlist={shortlist} onRemove={remove} onClear={clear} /> : null}
        {tab === 'history' ? <HistoryView onAddToShortlist={addMany} /> : null}
        {tab === 'stats' ? <StatsView /> : null}
        {tab === 'settings' ? <SettingsView /> : null}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                tab === t.id ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="relative text-lg">
                {t.icon}
                {t.id === 'shortlist' && shortlist.length > 0 ? (
                  <span className="absolute -right-2 -top-1 rounded-full bg-emerald-600 px-1 text-[10px] text-white">
                    {shortlist.length}
                  </span>
                ) : null}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <LibraryProvider>
      <AppShell />
    </LibraryProvider>
  )
}
