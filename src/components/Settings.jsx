function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-5">
      <div className="h-px flex-1 bg-gray-800" />
      <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</h2>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function DangerBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-left transition-all active:scale-95 bg-red-950/50 text-red-300 border border-red-900/60 hover:bg-red-950/80"
    >
      {children}
    </button>
  )
}

const SYNC_LABELS = {
  live:    { dot: 'text-green-400',  text: 'Live sync on' },
  syncing: { dot: 'text-yellow-400', text: 'Syncing…' },
  error:   { dot: 'text-red-400',    text: 'Sync error' },
  local:   { dot: 'text-gray-500',   text: 'Local only' },
}

export default function Settings({ dispatch, confirm, syncStatus = 'local' }) {
  const sync = SYNC_LABELS[syncStatus] ?? SYNC_LABELS.local
  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-10">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-6 pb-5 mb-1 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">The Bromsgrove Cup</div>
        <h1 className="text-xl font-black text-white">Settings</h1>
      </div>

      <SectionTitle>Reset Options</SectionTitle>
      <div className="space-y-2">
        <DangerBtn
          onClick={() => confirm(
            'Reset all scores? Team and player names will be kept.',
            () => dispatch({ type: 'RESET_SCORES' })
          )}
        >
          🔄 Reset Scores Only
        </DangerBtn>
        <DangerBtn
          onClick={() => confirm(
            'Reset all names to the Bromsgrove Cup defaults? Scores will be kept.',
            () => dispatch({ type: 'RESET_NAMES' })
          )}
        >
          ✏️ Reset Names Only
        </DangerBtn>
        <DangerBtn
          onClick={() => confirm(
            'Reset everything to Bromsgrove Cup defaults? All scores and name changes will be lost.',
            () => dispatch({ type: 'RESET_ALL' })
          )}
        >
          ♻️ Reset Everything
        </DangerBtn>
      </div>

      <div className="mt-10 text-center text-xs text-gray-700 space-y-1">
        <p className="font-bold text-gray-600">The Bromsgrove Cup</p>
        <p>9 matches · 81 points · First to 41 wins</p>
        <p className={sync.dot}>
          ● {sync.text}
        </p>
      </div>
    </div>
  )
}
