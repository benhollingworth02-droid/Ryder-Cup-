import {
  buildRoundLeaderboard, buildStablefordLeaderboard,
  calcHoleMatchResult, calcMatchStatus, matchStatusText,
} from '../utils/scoring'

const MEDAL = ['🥇', '🥈', '🥉']

const FORMAT_LABELS = {
  stroke:     'Stroke Play',
  stableford: 'Stableford',
  match_1v1:  'Match Play',
  fourballs:  'Fourballs',
}

export default function RoundLeaderboard({ round, players, roundPlayers, courseHoles, courses, scores, onBack, onScoring }) {
  const format    = round?.format ?? 'stroke'
  const isMatch   = format === 'match_1v1' || format === 'fourballs'
  const totalHoles = round?.holes ?? 18

  const courseName = courses?.find(c => c.id === round?.course_id)?.name ?? 'Unknown Course'
  const dateStr    = round
    ? new Date(round.date + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : ''

  // Match play: compute status
  const holeResults = isMatch
    ? Array.from({ length: totalHoles }, (_, i) =>
        calcHoleMatchResult(i + 1, scores, roundPlayers, courseHoles))
    : null

  const matchStatus = isMatch ? calcMatchStatus(holeResults, totalHoles) : null

  const teamA  = isMatch ? roundPlayers.filter(rp => rp.team === 1) : []
  const teamB  = isMatch ? roundPlayers.filter(rp => rp.team === 2) : []
  const sideAName = format === 'match_1v1'
    ? (players.find(p => p.id === teamA[0]?.player_id)?.name ?? 'Side A')
    : 'Team A'
  const sideBName = format === 'match_1v1'
    ? (players.find(p => p.id === teamB[0]?.player_id)?.name ?? 'Side B')
    : 'Team B'

  // Stroke leaderboard
  const strokeLb = (!isMatch && format !== 'stableford')
    ? buildRoundLeaderboard(scores, players, roundPlayers)
    : null

  // Stableford leaderboard
  const stableLb = format === 'stableford'
    ? buildStablefordLeaderboard(scores, players, roundPlayers, courseHoles)
    : null

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-6 pb-5 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-gray-400 active:scale-90 text-lg shrink-0">←</button>
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{dateStr}</div>
            <h1 className="text-xl font-black text-white truncate">{courseName}</h1>
            <div className="text-xs text-gray-600">
              {totalHoles} holes · {FORMAT_LABELS[format] ?? 'Stroke Play'}
            </div>
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

      <div className="px-4 pt-4 pb-10">

        {/* Match play result */}
        {isMatch && matchStatus && (
          <div className="mb-4">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Match Result</div>
              <div className="text-xl font-black text-white mb-1">
                {matchStatusText(matchStatus, sideAName, sideBName)}
              </div>
              <div className="text-xs text-gray-500">
                {matchStatus.played} holes played
                {matchStatus.remaining > 0 && !matchStatus.finished ? ` · ${matchStatus.remaining} remaining` : ''}
              </div>
            </div>

            {/* Hole-by-hole summary */}
            {matchStatus.played > 0 && (
              <div className="mt-3 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-800 flex gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <div className="flex-1">{sideAName}</div>
                  <div className="w-8 text-center">H</div>
                  <div className="flex-1 text-right">{sideBName}</div>
                </div>
                {holeResults?.map((result, i) => result !== null && (
                  <div key={i} className="px-4 py-1.5 border-b border-gray-800 last:border-0 flex items-center gap-2 text-xs">
                    <div className={`flex-1 font-bold ${result === 'a' ? 'text-blue-300' : 'text-gray-600'}`}>
                      {result === 'a' ? '●' : ''}
                    </div>
                    <div className="w-8 text-center text-gray-500 font-bold">{i + 1}</div>
                    <div className={`flex-1 text-right font-bold ${result === 'b' ? 'text-red-300' : result === 'halved' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {result === 'b' ? '●' : result === 'halved' ? '½' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stroke play leaderboard */}
        {strokeLb && (
          strokeLb.every(e => e.net === null) ? (
            <div className="text-center py-16 text-gray-600 text-sm">
              <div className="text-4xl mb-3">📋</div>
              No scores entered yet
            </div>
          ) : (
            <div className="space-y-2">
              {strokeLb.map((entry, i) => {
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
                        {entry.played} hole{entry.played !== 1 ? 's' : ''} · HCP {entry.playingHandicap}
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
          )
        )}

        {/* Stableford leaderboard */}
        {stableLb && (
          stableLb.every(e => e.points === null) ? (
            <div className="text-center py-16 text-gray-600 text-sm">
              <div className="text-4xl mb-3">📋</div>
              No scores entered yet
            </div>
          ) : (
            <div className="space-y-2">
              {stableLb.map((entry, i) => {
                const ranked = entry.points !== null
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
                        {entry.played} hole{entry.played !== 1 ? 's' : ''} · HCP {entry.playingHandicap}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ranked ? (
                        <>
                          <div className="text-2xl font-black text-green-400 leading-none">{entry.points}★</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">points</div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-700">No scores</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        <p className="text-[10px] text-gray-700 text-center mt-5">
          {format === 'stableford' ? 'Higher points wins' :
           isMatch ? 'Net score per hole · handicap from stroke index' :
           'Net = gross − playing handicap · lower wins'}
        </p>
      </div>
    </div>
  )
}
