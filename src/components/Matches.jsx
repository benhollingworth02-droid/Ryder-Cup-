import {
  calcMatchPlayStatus, calcMatchHoleByHoleScore,
  calcRyderCupTotals, ryderStatusMsg, fmtPts,
} from '../utils/scoring'

const TEAM_COLOR_BG = {
  blue:   'bg-blue-600',  red:    'bg-red-600',
  green:  'bg-green-600', amber:  'bg-amber-500',
  purple: 'bg-purple-600',
}
const TEAM_COLOR_TEXT = {
  blue: 'text-blue-300', red: 'text-red-300', green: 'text-green-300',
  amber: 'text-amber-300', purple: 'text-purple-300',
}
const TEAM_COLOR_BORDER = {
  blue: 'border-blue-700', red: 'border-red-700', green: 'border-green-700',
  amber: 'border-amber-700', purple: 'border-purple-700',
}

const RESULT_OPTS = [
  { value: 'teamAWin', label: 'Win',    aLabel: true },
  { value: 'teamBWin', label: 'Win',    bLabel: true },
  { value: 'halved',   label: 'Halved', both: true },
  { value: null,       label: 'Not played' },
]

// ─── Ryder Cup match card (matchResult mode) ──────────────────────────────────

function RyderMatchCard({ match, players, teams, dispatch }) {
  const teamA = teams[0]
  const teamB = teams[1]
  const aNames = match.teamAPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)
  const bNames = match.teamBPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)
  const result = match.result

  const borderColor = result === 'teamAWin' ? (TEAM_COLOR_BORDER[teamA?.color] || 'border-blue-700')
    : result === 'teamBWin' ? (TEAM_COLOR_BORDER[teamB?.color] || 'border-red-700')
    : result === 'halved' ? 'border-amber-700'
    : 'border-gray-700'

  const bgColor = result === 'teamAWin' ? 'bg-blue-950/40'
    : result === 'teamBWin' ? 'bg-red-950/40'
    : result === 'halved' ? 'bg-amber-950/30'
    : 'bg-gray-900/40'

  function setResult(val) {
    dispatch({ type: 'SET_MATCH_RESULT', id: match.id, result: val })
  }

  return (
    <div className={`rounded-2xl border-2 ${borderColor} ${bgColor} p-4 mb-3 transition-all duration-200`}>
      {/* Match header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">{match.name}</span>
          <span className="ml-2 text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{match.type}</span>
        </div>
        {match.holeRange && (
          <span className="text-[10px] text-gray-600 font-semibold">H{match.holeRange[0]}–{match.holeRange[1]}</span>
        )}
      </div>

      {/* Players */}
      <div className="flex items-stretch gap-2 mb-4">
        <div className={`flex-1 rounded-xl p-3 text-center transition-all ${result === 'teamAWin' ? 'bg-blue-700/40 ring-2 ring-blue-500/30' : result === 'halved' ? 'bg-blue-900/20' : 'bg-gray-800/40'}`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${TEAM_COLOR_TEXT[teamA?.color] || 'text-blue-300'}`}>
            {teamA?.name || 'Team A'}
          </div>
          <div className="text-sm font-bold text-white leading-snug">{aNames.join(' & ') || '—'}</div>
          {result === 'teamAWin' && <div className="text-xs text-green-400 mt-1.5 font-bold">✓ Win</div>}
          {result === 'halved' && <div className="text-xs text-amber-400 mt-1.5 font-bold">½</div>}
        </div>
        <div className="flex items-center text-gray-600 font-black text-xs">VS</div>
        <div className={`flex-1 rounded-xl p-3 text-center transition-all ${result === 'teamBWin' ? 'bg-red-700/40 ring-2 ring-red-500/30' : result === 'halved' ? 'bg-red-900/20' : 'bg-gray-800/40'}`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${TEAM_COLOR_TEXT[teamB?.color] || 'text-red-300'}`}>
            {teamB?.name || 'Team B'}
          </div>
          <div className="text-sm font-bold text-white leading-snug">{bNames.join(' & ') || '—'}</div>
          {result === 'teamBWin' && <div className="text-xs text-green-400 mt-1.5 font-bold">✓ Win</div>}
          {result === 'halved' && <div className="text-xs text-amber-400 mt-1.5 font-bold">½</div>}
        </div>
      </div>

      {/* Result buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setResult(result === 'teamAWin' ? null : 'teamAWin')}
          className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
            result === 'teamAWin'
              ? `${TEAM_COLOR_BG[teamA?.color] || 'bg-blue-600'} border-transparent text-white ring-2 ring-white/20`
              : 'bg-gray-800/50 border-gray-700 text-gray-400'
          }`}
        >
          {teamA?.name || 'Team A'} Win
        </button>
        <button
          onClick={() => setResult(result === 'teamBWin' ? null : 'teamBWin')}
          className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
            result === 'teamBWin'
              ? `${TEAM_COLOR_BG[teamB?.color] || 'bg-red-600'} border-transparent text-white ring-2 ring-white/20`
              : 'bg-gray-800/50 border-gray-700 text-gray-400'
          }`}
        >
          {teamB?.name || 'Team B'} Win
        </button>
        <button
          onClick={() => setResult(result === 'halved' ? null : 'halved')}
          className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
            result === 'halved'
              ? 'bg-amber-500 border-transparent text-white ring-2 ring-white/20'
              : 'bg-gray-800/50 border-gray-700 text-gray-400'
          }`}
        >
          Halved
        </button>
        <button
          onClick={() => setResult(null)}
          className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
            result === null
              ? 'bg-gray-600 border-gray-500 text-white'
              : 'bg-gray-800/50 border-gray-700 text-gray-400'
          }`}
        >
          Not Played
        </button>
      </div>
    </div>
  )
}

// ─── Ryder Cup match card (holeByHole mode) ───────────────────────────────────

function RyderMatchCardHoleByHole({ match, players, teams, holes, scores }) {
  const teamA = teams[0]
  const teamB = teams[1]
  const aNames = match.teamAPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)
  const bNames = match.teamBPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)

  const { aPoints, bPoints, totalHoles, playedHoles } = calcMatchHoleByHoleScore(match, holes, scores)

  const leading = aPoints > bPoints ? 'a' : bPoints > aPoints ? 'b' : null
  const borderColor = leading === 'a' ? (TEAM_COLOR_BORDER[teamA?.color] || 'border-blue-700')
    : leading === 'b' ? (TEAM_COLOR_BORDER[teamB?.color] || 'border-red-700')
    : 'border-gray-700'

  return (
    <div className={`rounded-2xl border-2 ${borderColor} bg-gray-900/40 p-4 mb-3`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">{match.name}</span>
          <span className="ml-2 text-[10px] bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase">{match.type}</span>
        </div>
        <span className="text-[10px] text-gray-600 font-semibold">
          {playedHoles}/{totalHoles} holes
        </span>
      </div>

      <div className="flex items-stretch gap-2">
        <div className={`flex-1 rounded-xl p-3 text-center ${leading === 'a' ? 'bg-blue-900/30 ring-2 ring-blue-600/20' : 'bg-gray-800/40'}`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${TEAM_COLOR_TEXT[teamA?.color] || 'text-blue-300'}`}>
            {teamA?.name || 'Team A'}
          </div>
          <div className="text-sm font-bold text-white leading-snug mb-1">{aNames.join(' & ') || '—'}</div>
          <div className={`text-3xl font-black ${leading === 'a' ? 'text-blue-200' : 'text-gray-400'}`}>{fmtPts(aPoints)}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">pts</div>
        </div>
        <div className="flex items-center text-gray-600 font-black text-xs">VS</div>
        <div className={`flex-1 rounded-xl p-3 text-center ${leading === 'b' ? 'bg-red-900/30 ring-2 ring-red-600/20' : 'bg-gray-800/40'}`}>
          <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${TEAM_COLOR_TEXT[teamB?.color] || 'text-red-300'}`}>
            {teamB?.name || 'Team B'}
          </div>
          <div className="text-sm font-bold text-white leading-snug mb-1">{bNames.join(' & ') || '—'}</div>
          <div className={`text-3xl font-black ${leading === 'b' ? 'text-red-200' : 'text-gray-400'}`}>{fmtPts(bPoints)}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">pts</div>
        </div>
      </div>
    </div>
  )
}

// ─── Match Play card (computed from scores) ───────────────────────────────────

function MatchPlayCard({ match, players, teams, holes, scores }) {
  const teamA = teams[0]
  const teamB = teams[1]
  const aNames = match.teamAPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)
  const bNames = match.teamBPlayerIds.map(id => players.find(p => p.id === id)?.name).filter(Boolean)

  const status = calcMatchPlayStatus(match, holes, scores)
  const { winner, leadingSide } = status

  const borderColor = winner === 'a' ? 'border-blue-600' : winner === 'b' ? 'border-red-600' : 'border-gray-700'

  return (
    <div className={`rounded-2xl border-2 ${borderColor} bg-gray-900/40 p-4 mb-3`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-black uppercase tracking-widest text-gray-500">{match.name}</span>
        <span className="text-[10px] text-gray-600 font-semibold">
          {status.holesPlayed}/{(match.holeRange ? match.holeRange[1] - match.holeRange[0] + 1 : holes.length)} holes
        </span>
      </div>

      <div className="flex items-stretch gap-2 mb-3">
        <div className={`flex-1 rounded-xl p-3 text-center ${winner === 'a' ? 'bg-blue-900/30 ring-2 ring-blue-600/20' : 'bg-gray-800/40'}`}>
          <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">{teamA?.name || 'Side A'}</div>
          <div className="text-sm font-bold text-white leading-snug">{aNames.join(' & ') || '—'}</div>
          {winner === 'a' && <div className="text-xs text-green-400 mt-1.5 font-bold">✓ Winner</div>}
        </div>
        <div className="flex items-center text-gray-600 font-black text-xs">VS</div>
        <div className={`flex-1 rounded-xl p-3 text-center ${winner === 'b' ? 'bg-red-900/30 ring-2 ring-red-600/20' : 'bg-gray-800/40'}`}>
          <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">{teamB?.name || 'Side B'}</div>
          <div className="text-sm font-bold text-white leading-snug">{bNames.join(' & ') || '—'}</div>
          {winner === 'b' && <div className="text-xs text-green-400 mt-1.5 font-bold">✓ Winner</div>}
        </div>
      </div>

      <div className="text-center">
        <span className={`font-bold text-sm ${
          winner ? 'text-green-400'
          : leadingSide ? 'text-yellow-300'
          : 'text-gray-400'
        }`}>
          {status.statusText}
        </span>
        {leadingSide && !winner && (
          <span className="text-gray-600 text-xs ml-1">
            ({leadingSide === 'a' ? aNames[0] || teamA?.name : bNames[0] || teamB?.name} leading)
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Matches Component ───────────────────────────────────────────────────

export default function Matches({ round, dispatch, setTab }) {
  const { matches, teams, players, holes, scores, format, ryderCupSettings } = round
  const teamA = teams[0]
  const teamB = teams[1]
  const isRyderCup = format === 'ryderCup'
  const scoringMethod = ryderCupSettings?.scoringMethod || 'matchResult'

  // Group matches by section
  const sections = {}
  for (const m of matches) {
    const key = m.section || 'Matches'
    if (!sections[key]) sections[key] = []
    sections[key].push(m)
  }

  // Ryder Cup team summary
  let ryderTotals = null
  if (isRyderCup) {
    ryderTotals = calcRyderCupTotals(matches, holes, scores, scoringMethod)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-950 to-gray-950 px-4 pt-6 pb-4">
        <div className="text-center mb-4">
          <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-0.5">
            {round.roundName || 'Round'}
          </div>
          <h1 className="text-xl font-black text-white">
            {isRyderCup ? 'Ryder Cup' : 'Match Play'}
          </h1>
        </div>

        {/* Team score (Ryder Cup) */}
        {isRyderCup && ryderTotals && (
          <div className="rounded-2xl bg-black/30 border border-gray-700 overflow-hidden">
            <div className="flex">
              <div className={`flex-1 py-4 text-center border-r border-gray-800`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${TEAM_COLOR_TEXT[teamA?.color] || 'text-blue-300'}`}>
                  {teamA?.name || 'Team A'}
                </div>
                <div className={`text-5xl font-black ${TEAM_COLOR_TEXT[teamA?.color] || 'text-blue-200'}`}>
                  {fmtPts(ryderTotals.aTotal)}
                </div>
              </div>
              <div className={`flex-1 py-4 text-center`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${TEAM_COLOR_TEXT[teamB?.color] || 'text-red-300'}`}>
                  {teamB?.name || 'Team B'}
                </div>
                <div className={`text-5xl font-black ${TEAM_COLOR_TEXT[teamB?.color] || 'text-red-200'}`}>
                  {fmtPts(ryderTotals.bTotal)}
                </div>
              </div>
            </div>
            <div className="py-2 text-center border-t border-gray-800 bg-black/20">
              {(() => {
                const ptw = ryderCupSettings?.pointsToWin || Math.ceil(matches.length / 2) + 0.5
                const { msg, winner } = ryderStatusMsg(ryderTotals.aTotal, ryderTotals.bTotal, ptw, teamA?.name || 'Team A', teamB?.name || 'Team B')
                return (
                  <span className={`text-sm font-bold ${winner ? 'text-yellow-300' : 'text-gray-300'}`}>
                    {winner && '🏆 '}{msg}
                  </span>
                )
              })()}
            </div>
          </div>
        )}

        {/* Scoring method badge (Ryder Cup) */}
        {isRyderCup && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">
              {scoringMethod === 'holeByHole' ? 'Hole-by-hole scoring' : 'Match result scoring'}
              {scoringMethod === 'matchResult' && ' · Tap to set result'}
            </span>
          </div>
        )}
      </div>

      {/* Match list */}
      <div className="px-4 pb-8">
        {matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No matches set up.</p>
            <button
              onClick={() => setTab('setup')}
              className="px-4 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm active:scale-95"
            >
              Go to Setup
            </button>
          </div>
        )}

        {Object.entries(sections).map(([section, sectionMatches]) => (
          <div key={section}>
            {Object.keys(sections).length > 1 && (
              <div className="flex items-center gap-3 my-4">
                <div className="h-px flex-1 bg-gray-800" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400">{section}</span>
                <div className="h-px flex-1 bg-gray-800" />
              </div>
            )}
            {sectionMatches.map(match => {
              if (isRyderCup) {
                if (scoringMethod === 'holeByHole') {
                  return <RyderMatchCardHoleByHole key={match.id} match={match} players={players} teams={teams} holes={holes} scores={scores} />
                }
                return <RyderMatchCard key={match.id} match={match} players={players} teams={teams} dispatch={dispatch} />
              }
              return <MatchPlayCard key={match.id} match={match} players={players} teams={teams} holes={holes} scores={scores} />
            })}
          </div>
        ))}

        {isRyderCup && scoringMethod === 'holeByHole' && matches.length > 0 && (
          <p className="text-center text-xs text-gray-600 mt-4">
            Enter hole-by-hole scores in the Scorecard tab. Results calculate automatically.
          </p>
        )}
      </div>
    </div>
  )
}
