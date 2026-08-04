import { buildRoundLeaderboard } from '../utils/scoring'

const MEDAL = ['🥇', '🥈', '🥉']

export default function RoundLeaderboard({ round, players, scores, onBack, onScoring }) {
  const leaderboard = buildRoundLeaderboard(scores, players)
  const dateStr = round
    ? new Date(round.date + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : ''

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-6 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-gray-400 active:scale-90 text-lg shrink-0">←</button>
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{dateStr}</div>
            <h1 className="text-xl font-black text-white truncate">{round?.course}</h1>
            <div className="text-xs text-gray-600">{round?.holes} holes · Results</div>
          </div>
          <button
            onClick={onScoring}
            className="w-9 h-9 flex items-center justify-center text-green-400 active:scale-90 text-lg shrink-0"
            title="Back to scoring"
          >
            ⛳
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="px-4 pt-4 pb-10">
        {leaderboard.every(e => e.net === null) ? (
          <div className="text-center py-16 text-gray-600 text-sm">
            <div className="text-4xl mb-3">📋</div>
            No scores entered yet
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => {
              const ranked = entry.net !== null
              return (
                <div
                  key={entry.player.id}
                  className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${
                    i === 0 && ranked ? 'bg-yellow-950/30 border-yellow-700/40' :
                    i === 1 && ranked ? 'bg-gray-800/40 border-gray-600/40' :
                    i === 2 && ranked ? 'bg-amber-950/20 border-amber-800/30' :
                    'bg-gray-900 border-gray-800'
                  }`}
                >
                  <div className="w-9 text-center shrink-0">
                    {ranked && i < 3
                      ? <span className="text-xl">{MEDAL[i]}</span>
                      : <span className={`text-sm font-black ${ranked ? 'text-gray-400' : 'text-gray-700'}`}>
                          {ranked ? i + 1 : '—'}
                        </span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-black text-white text-sm truncate">{entry.player.name}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {entry.played} hole{entry.played !== 1 ? 's' : ''} · HCP {entry.player.handicap}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {ranked ? (
                      <>
                        <div className="text-2xl font-black text-green-400 leading-none">{entry.net}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Gross {entry.gross}</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-700">No scores</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-[10px] text-gray-700 text-center mt-5">Net = gross − handicap · lower is better</p>
      </div>
    </div>
  )
}
