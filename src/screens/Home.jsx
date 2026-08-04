function fmt(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function RoundCard({ round, onScoring, onLeaderboard }) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
          {fmt(round.date)}
        </div>
        <div className="font-black text-white text-base leading-tight">{round.course}</div>
        <div className="text-xs text-gray-600 mt-0.5">{round.holes} holes</div>
      </div>
      <div className="flex">
        <button
          onClick={() => onScoring(round)}
          className="flex-1 py-3.5 text-sm font-bold text-green-400 border-r border-gray-800 active:bg-gray-800/60 transition-colors"
        >
          ⛳ Enter Scores
        </button>
        <button
          onClick={() => onLeaderboard(round)}
          className="flex-1 py-3.5 text-sm font-bold text-blue-400 active:bg-gray-800/60 transition-colors"
        >
          🏆 Results
        </button>
      </div>
    </div>
  )
}

export default function Home({ rounds, onNewRound, onScoring, onLeaderboard }) {
  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-5 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Golf Trip</div>
        <h1 className="text-3xl font-black text-white">Rounds</h1>
      </div>

      <button
        onClick={onNewRound}
        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-base rounded-2xl active:scale-95 transition-all mb-5 shadow-lg shadow-green-900/30"
      >
        + New Round
      </button>

      {rounds.length === 0 ? (
        <div className="text-center py-16 text-gray-700">
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
              onScoring={onScoring}
              onLeaderboard={onLeaderboard}
            />
          ))}
        </div>
      )}
    </div>
  )
}
