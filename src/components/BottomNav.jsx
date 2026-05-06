const TABS = [
  { id: 'scoreboard', icon: '🏆', label: 'Scoreboard' },
  { id: 'matches',    icon: '⛳', label: 'Scorecard' },
  { id: 'setup',      icon: '✏️', label: 'Setup' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

export default function BottomNav({ tab, setTab }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-900/95 border-t border-gray-800 backdrop-blur-sm z-40">
      <div className="flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors active:scale-95 ${
              tab === t.id ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide leading-none ${
              tab === t.id ? 'text-green-400' : 'text-gray-500'
            }`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
