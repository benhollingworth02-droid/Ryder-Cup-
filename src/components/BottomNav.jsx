const TABS = [
  { id: 'home',              icon: '⛳', label: 'Rounds'   },
  { id: 'players',          icon: '👤', label: 'Players'  },
  { id: 'courses',          icon: '🏌️', label: 'Courses'  },
  { id: 'trip-leaderboard', icon: '🏆', label: 'Standings' },
]

export default function BottomNav({ screen, onHome, onPlayers, onCourses, onLeaderboard }) {
  const handlers = {
    'home':              onHome,
    'players':           onPlayers,
    'courses':           onCourses,
    'trip-leaderboard':  onLeaderboard,
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 border-t border-slate-800 backdrop-blur-sm z-40">
      <div className="flex">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={handlers[t.id]}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-colors active:scale-95 ${
              screen === t.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className="text-xl leading-none">{t.icon}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wide leading-none mt-0.5 ${
              screen === t.id ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {t.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
