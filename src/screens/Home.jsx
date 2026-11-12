const FORMAT_LABELS = {
  stroke:     'Stroke Play',
  stableford: 'Stableford',
  match_1v1:  'Match Play',
  fourballs:  'Fourballs',
}

const FORMAT_COLORS = {
  stroke:     'bg-blue-900/50 text-blue-300',
  stableford: 'bg-purple-900/50 text-purple-300',
  match_1v1:  'bg-orange-900/50 text-orange-300',
  fourballs:  'bg-yellow-900/50 text-yellow-300',
}

function fmt(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function RoundCard({ round, courses, onScoring, onLeaderboard, onDelete }) {
  const course = courses.find(c => c.id === round.course_id)
  const courseName = course?.name ?? 'Unknown Course'
  const formatLabel = FORMAT_LABELS[round.format] ?? 'Stroke Play'
  const formatColor = FORMAT_COLORS[round.format] ?? FORMAT_COLORS.stroke

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-800 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
            {fmt(round.date)}
          </div>
          <div className="font-black text-white text-base leading-tight">{courseName}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formatColor}`}>
              {formatLabel}
            </span>
            <span className="text-[10px] text-slate-600">{round.holes} holes</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(round)}
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-red-400 active:scale-90 rounded-lg shrink-0 mt-0.5"
          title="Delete round"
        >
          🗑
        </button>
      </div>
      <div className="flex">
        <button
          onClick={() => onScoring(round)}
          className="flex-1 py-3.5 text-sm font-bold text-emerald-400 border-r border-slate-800 active:bg-slate-800/60 transition-colors"
        >
          ⛳ Enter Scores
        </button>
        <button
          onClick={() => onLeaderboard(round)}
          className="flex-1 py-3.5 text-sm font-bold text-blue-400 active:bg-slate-800/60 transition-colors"
        >
          🏆 Results
        </button>
      </div>
    </div>
  )
}

export default function Home({ rounds, courses, onNewRound, onScoring, onLeaderboard, onDeleteRound }) {
  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 -mx-4 px-4 pt-8 pb-6 mb-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Golf Scorer</div>
        <h1 className="text-3xl font-black text-white tracking-tight">The Card</h1>
      </div>

      <button
        onClick={onNewRound}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base rounded-2xl active:scale-95 transition-all mb-5 shadow-lg shadow-emerald-900/30"
      >
        + New Round
      </button>

      {rounds.length === 0 ? (
        <div className="text-center py-16 text-slate-700">
          <div className="text-5xl mb-4">⛳</div>
          <p className="font-bold text-sm">No rounds yet</p>
          <p className="text-xs mt-1">Tap "New Round" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rounds.map(round => (
            <RoundCard
              key={round.id}
              round={round}
              courses={courses}
              onScoring={onScoring}
              onLeaderboard={onLeaderboard}
              onDelete={onDeleteRound}
            />
          ))}
        </div>
      )}
    </div>
  )
}
