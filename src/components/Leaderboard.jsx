import {
  calcStrokeLeaderboard, calcStablefordLeaderboard,
  calcMatchPlayStatus, calcRyderCupTotals, ryderStatusMsg,
  diffLabel, fmtPts, scoreBadgeClass,
} from '../utils/scoring'

const TEAM_COLOR = {
  blue:   'text-blue-300 bg-blue-900/30 border-blue-700',
  red:    'text-red-300 bg-red-900/30 border-red-700',
  green:  'text-green-300 bg-green-900/30 border-green-700',
  amber:  'text-amber-300 bg-amber-900/30 border-amber-700',
  purple: 'text-purple-300 bg-purple-900/30 border-purple-700',
}

function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="h-px flex-1 bg-gray-800" />
      <span className="text-[10px] font-black uppercase tracking-widest text-green-400">{children}</span>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function MedalBadge({ position }) {
  if (position === 1) return <span className="text-yellow-400 text-lg">🥇</span>
  if (position === 2) return <span className="text-gray-300 text-lg">🥈</span>
  if (position === 3) return <span className="text-amber-600 text-lg">🥉</span>
  return <span className="text-gray-600 font-bold text-sm w-6 text-center">{position}</span>
}

// ─── Stroke Play Leaderboard ──────────────────────────────────────────────────

function StrokeLeaderboard({ round }) {
  const { players, scores, holes, numHoles } = round
  const lb = calcStrokeLeaderboard(players, scores, holes)
  const totalPar = holes.reduce((s, h) => s + h.par, 0)

  return (
    <div>
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/40 flex text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span className="w-8">#</span>
          <span className="flex-1">Player</span>
          <span className="w-12 text-center">Score</span>
          <span className="w-12 text-center">+/−</span>
          <span className="w-14 text-right">Holes</span>
        </div>
        {lb.length === 0 && (
          <p className="text-gray-600 text-center py-6 text-sm">No scores yet.</p>
        )}
        {lb.map((row, i) => {
          const prevRow = lb[i - 1]
          const tied = prevRow && prevRow.strokes === row.strokes && prevRow.completed > 0
          const pos = tied ? '—' : row.position
          const diff = row.diff

          return (
            <div key={row.player.id}
              className={`flex items-center px-4 py-3 border-t border-gray-800 ${
                row.position === 1 && row.completed > 0 ? 'bg-yellow-900/10' : ''
              }`}>
              <div className="w-8 flex items-center">
                {row.completed > 0
                  ? <MedalBadge position={typeof pos === 'number' ? pos : row.position} />
                  : <span className="text-gray-700 font-bold text-sm">—</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">{row.player.name}</div>
                {row.player.handicap != null && (
                  <div className="text-[10px] text-gray-600">HCP {row.player.handicap}</div>
                )}
              </div>
              <div className="w-12 text-center">
                <span className="font-black text-white text-lg">
                  {row.completed > 0 ? row.strokes : '—'}
                </span>
              </div>
              <div className="w-12 text-center">
                {row.completed > 0 ? (
                  <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-lg text-xs font-bold ${scoreBadgeClass(diff)}`}>
                    {diffLabel(diff)}
                  </span>
                ) : <span className="text-gray-700">—</span>}
              </div>
              <div className="w-14 text-right text-xs text-gray-500 font-semibold">
                {row.completed}/{numHoles}
              </div>
            </div>
          )
        })}
      </div>

      {/* Course par info */}
      <div className="text-center mt-3 text-xs text-gray-600">
        Course par: {totalPar} · {numHoles} holes
      </div>
    </div>
  )
}

// ─── Stableford Leaderboard ───────────────────────────────────────────────────

function StablefordLeaderboard({ round }) {
  const { players, scores, holes, numHoles } = round
  const lb = calcStablefordLeaderboard(players, scores, holes)

  return (
    <div>
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800/40 flex text-[10px] font-black uppercase tracking-widest text-gray-500">
          <span className="w-8">#</span>
          <span className="flex-1">Player</span>
          <span className="w-16 text-center">Points</span>
          <span className="w-14 text-right">Holes</span>
        </div>
        {lb.length === 0 && (
          <p className="text-gray-600 text-center py-6 text-sm">No scores yet.</p>
        )}
        {lb.map((row, i) => {
          const prevRow = lb[i - 1]
          const tied = prevRow && prevRow.points === row.points && prevRow.completed > 0
          return (
            <div key={row.player.id}
              className={`flex items-center px-4 py-3 border-t border-gray-800 ${
                row.position === 1 && row.completed > 0 ? 'bg-yellow-900/10' : ''
              }`}>
              <div className="w-8 flex items-center">
                {row.completed > 0 ? <MedalBadge position={row.position} /> : <span className="text-gray-700 font-bold text-sm">—</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm truncate">{row.player.name}</div>
                {row.player.handicap != null && (
                  <div className="text-[10px] text-gray-600">HCP {row.player.handicap}</div>
                )}
              </div>
              <div className="w-16 text-center">
                <span className={`font-black text-2xl ${row.completed > 0 ? 'text-green-400' : 'text-gray-700'}`}>
                  {row.completed > 0 ? row.points : '—'}
                </span>
              </div>
              <div className="w-14 text-right text-xs text-gray-500 font-semibold">
                {row.completed}/{numHoles}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stableford reference */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] text-gray-600">
        {[['Eagle', '4pts'], ['Birdie', '3pts'], ['Par', '2pts'], ['Bogey', '1pt'], ['Double+', '0pts'], ['HCP', 'net']].map(([k, v]) => (
          <div key={k} className="bg-gray-900 rounded-lg p-1.5">
            <div className="font-bold text-gray-500">{k}</div>
            <div className="text-gray-700">{v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Match Play Leaderboard ───────────────────────────────────────────────────

function MatchPlayLeaderboard({ round }) {
  const { matches, holes, scores, players, teams } = round
  const teamA = teams[0]
  const teamB = teams[1]

  if (matches.length === 0) {
    return <p className="text-gray-600 text-center py-10 text-sm">No matches configured.</p>
  }

  return (
    <div className="space-y-3">
      {matches.map(match => {
        const status = calcMatchPlayStatus(match, holes, scores)
        const aNames = match.teamAPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)
        const bNames = match.teamBPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)

        const winnerSide = status.winner
        const borderColor = winnerSide === 'a' ? 'border-blue-600' : winnerSide === 'b' ? 'border-red-600' : 'border-gray-700'

        return (
          <div key={match.id} className={`rounded-2xl border-2 ${borderColor} bg-gray-900/60 p-4`}>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              {match.name} · {match.type} · H{match.holeRange?.[0]}–{match.holeRange?.[1]}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className={`flex-1 p-2.5 rounded-xl text-center ${winnerSide === 'a' ? 'bg-blue-900/40 ring-2 ring-blue-600/30' : 'bg-gray-800/40'}`}>
                <div className="text-[10px] font-black text-blue-400 uppercase tracking-wide mb-1">{teamA?.name || 'Side A'}</div>
                <div className="text-sm font-bold text-white leading-snug">{aNames.join(' & ') || '—'}</div>
                {winnerSide === 'a' && <div className="text-green-400 text-xs mt-1 font-bold">✓ Winner</div>}
              </div>
              <div className="text-gray-600 font-bold text-sm">VS</div>
              <div className={`flex-1 p-2.5 rounded-xl text-center ${winnerSide === 'b' ? 'bg-red-900/40 ring-2 ring-red-600/30' : 'bg-gray-800/40'}`}>
                <div className="text-[10px] font-black text-red-400 uppercase tracking-wide mb-1">{teamB?.name || 'Side B'}</div>
                <div className="text-sm font-bold text-white leading-snug">{bNames.join(' & ') || '—'}</div>
                {winnerSide === 'b' && <div className="text-green-400 text-xs mt-1 font-bold">✓ Winner</div>}
              </div>
            </div>
            <div className="text-center">
              <span className={`font-bold text-sm ${
                winnerSide ? 'text-green-400' : status.leadingSide ? 'text-yellow-300' : 'text-gray-400'
              }`}>
                {status.statusText}
              </span>
              {status.holesPlayed > 0 && (
                <span className="text-gray-600 text-xs ml-2">({status.holesPlayed} played)</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Ryder Cup Overall Leaderboard ───────────────────────────────────────────

function RyderLeaderboard({ round }) {
  const { matches, holes, scores, teams, ryderCupSettings } = round
  const teamA = teams[0]
  const teamB = teams[1]
  const method = ryderCupSettings?.scoringMethod || 'matchResult'
  const pointsToWin = ryderCupSettings?.pointsToWin || Math.ceil(matches.length / 2) + 0.5

  const { aTotal, bTotal } = calcRyderCupTotals(matches, holes, scores, method)
  const { msg, winner } = ryderStatusMsg(aTotal, bTotal, pointsToWin, teamA?.name || 'Team A', teamB?.name || 'Team B')

  return (
    <div className="space-y-4">
      {/* Team score banner */}
      <div className={`rounded-2xl border-2 overflow-hidden ${winner ? 'border-yellow-500' : 'border-gray-700'}`}>
        <div className="flex">
          <div className={`flex-1 py-5 text-center border-r border-gray-800 ${winner === 'a' ? 'bg-blue-900/30' : 'bg-gray-900/40'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">{teamA?.name || 'Team A'}</div>
            <div className={`text-5xl font-black ${winner === 'a' ? 'text-yellow-300' : 'text-blue-200'}`}>{fmtPts(aTotal)}</div>
          </div>
          <div className={`flex-1 py-5 text-center ${winner === 'b' ? 'bg-red-900/30' : 'bg-gray-900/40'}`}>
            <div className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-1">{teamB?.name || 'Team B'}</div>
            <div className={`text-5xl font-black ${winner === 'b' ? 'text-yellow-300' : 'text-red-200'}`}>{fmtPts(bTotal)}</div>
          </div>
        </div>
        <div className={`py-2.5 text-center border-t border-gray-800 ${winner ? 'bg-yellow-900/20' : 'bg-black/20'}`}>
          <span className={`font-bold text-sm ${winner ? 'text-yellow-300' : 'text-gray-300'}`}>
            {winner && '🏆 '}{msg}
          </span>
        </div>
      </div>

      {winner && (
        <div className="text-center py-4 rounded-2xl bg-yellow-900/20 border border-yellow-700/40">
          <div className="text-4xl mb-2">🏆</div>
          <div className="font-black text-yellow-300 text-lg uppercase tracking-wide">
            {winner === 'a' ? teamA?.name : teamB?.name} win!
          </div>
          <div className="text-yellow-600 text-sm mt-1">First to {fmtPts(pointsToWin)} points</div>
        </div>
      )}

      {/* Points to win progress */}
      <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-3">
        <div className="flex justify-between text-xs text-gray-500 font-semibold mb-1.5">
          <span>{fmtPts(aTotal)} / {fmtPts(pointsToWin)}</span>
          <span className="text-gray-600">Need {fmtPts(pointsToWin)} to win</span>
          <span>{fmtPts(bTotal)} / {fmtPts(pointsToWin)}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
          <div className="bg-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (aTotal / (ryderCupSettings?.totalPoints || matches.length)) * 100)}%` }} />
          <div className="bg-red-600 rounded-full transition-all duration-500 ml-auto"
            style={{ width: `${Math.min(100, (bTotal / (ryderCupSettings?.totalPoints || matches.length)) * 100)}%` }} />
        </div>
      </div>

      {/* Completion */}
      <div className="text-center text-xs text-gray-600">
        {method === 'matchResult'
          ? `${matches.filter(m => m.result).length} of ${matches.length} matches completed`
          : `Hole-by-hole scoring · ${fmtPts(aTotal + bTotal)} of ${ryderCupSettings?.totalPoints || '?'} points played`
        }
      </div>
    </div>
  )
}

// ─── Main Leaderboard ─────────────────────────────────────────────────────────

export default function Leaderboard({ round }) {
  const { format } = round

  const title = {
    strokePlay: 'Stroke Play',
    stableford: 'Stableford',
    matchPlay: 'Match Play',
    ryderCup: 'Ryder Cup',
  }[format] || 'Leaderboard'

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-8">
      <div className="bg-gradient-to-b from-green-950 to-gray-950 px-0 pt-6 pb-4 -mx-4 px-4 mb-2">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-0.5">
            {round.roundName || 'Round'}
          </div>
          <h1 className="text-xl font-black text-white">{title} Leaderboard</h1>
          {round.courseName && (
            <p className="text-xs text-gray-500 mt-0.5">{round.courseName}</p>
          )}
        </div>
      </div>

      {format === 'strokePlay' && <StrokeLeaderboard round={round} />}
      {format === 'stableford' && <StablefordLeaderboard round={round} />}
      {format === 'matchPlay' && <MatchPlayLeaderboard round={round} />}
      {format === 'ryderCup' && <RyderLeaderboard round={round} />}
    </div>
  )
}
