import { scoreDiff, diffLabel, scoreBadgeClass, scoreName, handicapStrokesOnHole } from '../utils/scoring'

function ScoreBadge({ gross, par }) {
  const diff = scoreDiff(gross, par)
  return (
    <span className={`inline-flex items-center justify-center min-w-[2rem] h-8 px-2 rounded-lg text-sm font-bold ${scoreBadgeClass(diff)}`}>
      {gross != null ? diffLabel(diff) : '—'}
    </span>
  )
}

function PlayerRow({ player, hole, score, onAdjust, onClear }) {
  const gross = score?.gross
  const pickedUp = score?.pickedUp
  const diff = scoreDiff(gross, hole.par)
  const extraStrokes = handicapStrokesOnHole(player.handicap, hole.strokeIndex, 18)

  return (
    <div className="py-3 border-b border-gray-800 last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex-1 font-semibold text-white text-sm">{player.name}</span>
        {player.handicap != null && extraStrokes > 0 && (
          <span className="text-[10px] text-green-400 font-bold">
            {'●'.repeat(extraStrokes)} stroke{extraStrokes > 1 ? 's' : ''}
          </span>
        )}
        {gross != null && (
          <span className={`text-[10px] font-semibold ${
            diff == null ? 'text-gray-500'
            : diff < 0 ? 'text-red-400' : diff === 0 ? 'text-gray-400' : 'text-blue-400'
          }`}>
            {scoreName(diff)}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onAdjust(-1)}
          disabled={pickedUp}
          className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 disabled:opacity-30"
        >
          −
        </button>

        <div className="flex-1 text-center">
          {pickedUp ? (
            <span className="text-gray-500 font-bold text-lg">PU</span>
          ) : gross != null ? (
            <span className={`text-3xl font-black ${
              diff == null ? 'text-white'
              : diff <= -2 ? 'text-yellow-400'
              : diff === -1 ? 'text-red-400'
              : diff === 0 ? 'text-white'
              : diff === 1 ? 'text-blue-400'
              : 'text-gray-500'
            }`}>
              {gross}
            </span>
          ) : (
            <span className="text-gray-700 font-bold text-3xl">—</span>
          )}
        </div>

        <button
          onClick={() => onAdjust(+1)}
          disabled={pickedUp}
          className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 disabled:opacity-30"
        >
          +
        </button>

        <button
          onClick={onClear}
          className={`w-12 h-12 rounded-xl border text-xs font-bold flex items-center justify-center active:scale-90 ${
            pickedUp
              ? 'bg-gray-600 border-gray-500 text-white'
              : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}
          title={pickedUp ? 'Mark as played' : 'Picked up / no score'}
        >
          {pickedUp ? '↩' : 'PU'}
        </button>
      </div>
    </div>
  )
}

export default function Scorecard({ round, dispatch, ui, setHole }) {
  const { holes, players, scores, numHoles } = round
  const hole = holes.find(h => h.number === ui.activeHole) || holes[0]
  if (!hole) return null

  const totalPar = holes.reduce((s, h) => s + h.par, 0)
  const playedHoles = holes.filter(h =>
    players.some(p => scores[p.id]?.[h.number]?.gross != null)
  ).length

  function handleAdjust(playerId, delta) {
    const current = scores[playerId]?.[hole.number]
    const currentGross = current?.gross
    const newGross = currentGross != null ? Math.max(1, currentGross + delta) : hole.par + (delta > 0 ? delta - 1 : 0)
    dispatch({
      type: 'SET_SCORE',
      playerId,
      holeNumber: hole.number,
      score: { gross: Math.max(1, newGross), pickedUp: false },
    })
  }

  function handleClear(playerId) {
    const current = scores[playerId]?.[hole.number]
    if (current?.pickedUp) {
      // Unmark pickup — clear the score entirely
      dispatch({ type: 'CLEAR_HOLE_SCORE', playerId, holeNumber: hole.number })
    } else if (current?.gross != null) {
      // Mark as picked up
      dispatch({
        type: 'SET_SCORE',
        playerId,
        holeNumber: hole.number,
        score: { gross: null, pickedUp: true },
      })
    } else {
      dispatch({ type: 'CLEAR_HOLE_SCORE', playerId, holeNumber: hole.number })
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hole header */}
      <div className="bg-gradient-to-b from-green-950 to-gray-900 px-4 pt-6 pb-4">
        <div className="text-center mb-3">
          <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-1">
            {round.roundName || 'Scorecard'}
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-black text-white">H{hole.number}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Hole</div>
            </div>
            <div className="w-px h-10 bg-gray-700" />
            <div className="text-center">
              <div className="text-4xl font-black text-green-400">{hole.par}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Par</div>
            </div>
            {hole.strokeIndex && (
              <>
                <div className="w-px h-10 bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-400">{hole.strokeIndex}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">SI</div>
                </div>
              </>
            )}
            {hole.yardage && (
              <>
                <div className="w-px h-10 bg-gray-700" />
                <div className="text-center">
                  <div className="text-2xl font-black text-gray-300">{hole.yardage}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">yds</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Hole navigation */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setHole(Math.max(1, hole.number - 1))}
            disabled={hole.number === 1}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-30"
          >
            ← Hole {Math.max(1, hole.number - 1)}
          </button>

          <div className="text-xs text-gray-600 whitespace-nowrap font-semibold">
            {playedHoles}/{numHoles}
          </div>

          <button
            onClick={() => setHole(Math.min(numHoles, hole.number + 1))}
            disabled={hole.number === numHoles}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-30"
          >
            Hole {Math.min(numHoles, hole.number + 1)} →
          </button>
        </div>
      </div>

      {/* Hole selector strip */}
      <div className="flex overflow-x-auto px-4 py-2 gap-1.5 bg-gray-900/50 border-b border-gray-800">
        {holes.map(h => {
          const anyScore = players.some(p => scores[p.id]?.[h.number]?.gross != null)
          const isActive = h.number === hole.number
          return (
            <button
              key={h.number}
              onClick={() => setHole(h.number)}
              className={`shrink-0 w-8 h-8 rounded-lg text-xs font-black transition-all ${
                isActive
                  ? 'bg-green-600 text-white'
                  : anyScore
                  ? 'bg-gray-700 text-green-300'
                  : 'bg-gray-800 text-gray-600'
              }`}
            >
              {h.number}
            </button>
          )
        })}
      </div>

      {/* Score entries */}
      <div className="px-4 py-2">
        {players.length === 0 ? (
          <p className="text-center text-gray-600 py-10">No players in this round.</p>
        ) : (
          players.map(player => (
            <PlayerRow
              key={player.id}
              player={player}
              hole={hole}
              score={scores[player.id]?.[hole.number]}
              onAdjust={delta => handleAdjust(player.id, delta)}
              onClear={() => handleClear(player.id)}
            />
          ))
        )}
      </div>

      {/* Totals summary per player */}
      {players.length > 0 && (
        <div className="mx-4 mb-6 mt-2 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-2 bg-gray-800/50 text-xs font-black uppercase tracking-widest text-gray-500">
            Running Totals
          </div>
          {players.map(player => {
            let strokes = 0, par = 0, done = 0
            holes.forEach(h => {
              const s = scores[player.id]?.[h.number]
              if (s?.gross != null) { strokes += s.gross; par += h.par; done++ }
            })
            const diff = strokes - par
            return (
              <div key={player.id} className="flex items-center px-4 py-2.5 border-t border-gray-800 first:border-0">
                <span className="flex-1 text-sm font-semibold text-white">{player.name}</span>
                <span className="text-xs text-gray-500 mr-3">{done}/{numHoles} holes</span>
                <span className="text-sm font-bold text-white mr-2">{done > 0 ? strokes : '—'}</span>
                {done > 0 && (
                  <ScoreBadge gross={strokes} par={par} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
