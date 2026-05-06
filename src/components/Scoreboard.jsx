import { calcMatchPoints, calcHoleWinner, calcTotalHolesPlayed, getStatusMsg, fmtPts } from '../utils/scoring'
import { POINTS_TO_WIN, TOTAL_POINTS } from '../App'

function HoleDot({ result }) {
  const cls =
    result === 'a' ? 'bg-blue-500' :
    result === 'b' ? 'bg-red-500' :
    result === 'halved' ? 'bg-gray-500' :
    'bg-gray-800'
  return <span className={`inline-block w-2 h-2 rounded-full ${cls}`} />
}

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3 mb-2 mt-4">
      <div className="h-px flex-1 bg-gray-800" />
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">{label}</span>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function MatchRowSimple({ match, state, onPress }) {
  const { a, b } = calcMatchPoints(match, state.holes, state.scores)
  const [start, end] = match.holeRange
  const holes = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const getPlayerNames = (ids) =>
    ids.map(id => state.players.find(p => p.id === id)?.name ?? id).join(' & ')

  return (
    <button
      onClick={onPress}
      className="w-full text-left bg-gray-900 rounded-xl border border-gray-800 p-3 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{match.name}</span>
        <div className="flex items-center gap-1.5 text-xs font-black">
          <span className="text-blue-400">{fmtPts(a)}</span>
          <span className="text-gray-600">–</span>
          <span className="text-red-400">{fmtPts(b)}</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs text-gray-400 truncate max-w-[130px]">{getPlayerNames(match.teamAPlayerIds)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs text-gray-400 truncate max-w-[130px]">{getPlayerNames(match.teamBPlayerIds)}</span>
          </div>
        </div>
        <div className="flex gap-0.5 flex-wrap justify-end max-w-[100px]">
          {holes.map(h => (
            <HoleDot key={h} result={calcHoleWinner(h, match, state.scores)} />
          ))}
        </div>
      </div>
    </button>
  )
}

export default function Scoreboard({ state, ptsA, ptsB, teamA, teamB, onNavigateMatches }) {
  const { msg, winner } = getStatusMsg(ptsA, ptsB, POINTS_TO_WIN, teamA.name, teamB.name)
  const holesPlayed = calcTotalHolesPlayed(state.matches, state.holes, state.scores)
  const progressA = (ptsA / TOTAL_POINTS) * 100
  const progressB = (ptsB / TOTAL_POINTS) * 100
  const winLinePercent = (POINTS_TO_WIN / TOTAL_POINTS) * 100

  const front9 = state.matches.filter(m => m.section === 'front9')
  const back9 = state.matches.filter(m => m.section === 'back9')

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1">
          {winner ? '🏆' : '⛳'} The Bromsgrove Cup
        </div>
        <div className={`text-sm font-bold mt-1 ${
          winner === 'a' ? 'text-blue-400' :
          winner === 'b' ? 'text-red-400' :
          'text-gray-300'
        }`}>
          {msg}
        </div>
      </div>

      {/* Big scores */}
      <div className="flex items-stretch gap-3 mb-4">
        <div className="flex-1 bg-blue-950/60 border border-blue-800/50 rounded-2xl p-4 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1 truncate">
            {teamA.name}
          </div>
          <div className="text-5xl font-black text-blue-300">{fmtPts(ptsA)}</div>
          <div className="text-xs text-blue-600 mt-1">pts</div>
        </div>
        <div className="flex items-center justify-center px-1">
          <div className="text-gray-700 font-black text-lg">vs</div>
        </div>
        <div className="flex-1 bg-red-950/60 border border-red-800/50 rounded-2xl p-4 text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1 truncate">
            {teamB.name}
          </div>
          <div className="text-5xl font-black text-red-300">{fmtPts(ptsB)}</div>
          <div className="text-xs text-red-600 mt-1">pts</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-600 mb-1">
          <span className="text-blue-700">{fmtPts(ptsA)} pts</span>
          <span>Need {POINTS_TO_WIN} to win · {holesPlayed} holes played</span>
          <span className="text-red-700">{fmtPts(ptsB)} pts</span>
        </div>
        <div className="relative">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressA}%` }}
            />
            <div
              className="h-full bg-red-600 transition-all duration-500"
              style={{ width: `${progressB}%` }}
            />
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/70"
            style={{ left: `${winLinePercent}%` }}
          />
        </div>
      </div>

      {/* Front 9 */}
      <SectionHeader label="Front 9 — Fourballs" />
      <div className="space-y-2 mb-2">
        {front9.map(m => (
          <MatchRowSimple key={m.id} match={m} state={state} onPress={onNavigateMatches} />
        ))}
      </div>

      {/* Back 9 */}
      <SectionHeader label="Back 9 — Singles" />
      <div className="space-y-2">
        {back9.map(m => (
          <MatchRowSimple key={m.id} match={m} state={state} onPress={onNavigateMatches} />
        ))}
      </div>
    </div>
  )
}
