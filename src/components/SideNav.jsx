const TABS = [
  { id: 'home',              icon: '⛳', label: 'Rounds'   },
  { id: 'players',          icon: '👤', label: 'Players'  },
  { id: 'courses',          icon: '🏌️', label: 'Courses'  },
  { id: 'trip-leaderboard', icon: '🏆', label: 'Standings' },
]

export default function SideNav({ screen, onHome, onPlayers, onCourses, onLeaderboard }) {
  const handlers = {
    'home':              onHome,
    'players':           onPlayers,
    'courses':           onCourses,
    'trip-leaderboard':  onLeaderboard,
  }

  return (
    <div className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-slate-900 border-r border-slate-800 z-50">
      <div className="px-6 pt-8 pb-6 border-b border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Golf Scorer</div>
        <div className="text-2xl font-black text-white tracking-tight">The Card</div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={handlers[t.id]}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all active:scale-95 ${
              screen === t.id
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-lg leading-none w-6 text-center">{t.icon}</span>
            <span className={`text-sm font-semibold ${screen === t.id ? 'text-emerald-400' : ''}`}>{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-800">
        <div className="text-[10px] text-slate-700 font-medium">⛳ The Card v2</div>
      </div>
    </div>
  )
}
