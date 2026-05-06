import { useState, useRef } from 'react'
import { calcHoleWinner, calcTotalPoints, fmtPts } from '../utils/scoring'

const POINTS_TO_WIN = 41

function getHoleAggregate(holeNum, matches, scores) {
  let a = 0, b = 0, played = 0
  for (const m of matches) {
    if (holeNum < m.holeRange[0] || holeNum > m.holeRange[1]) continue
    const w = calcHoleWinner(holeNum, m, scores)
    if (w === 'a') { a++; played++ }
    else if (w === 'b') { b++; played++ }
    else if (w === 'halved') { a += 0.5; b += 0.5; played++ }
  }
  return { a, b, played }
}

function HoleResultPill({ winner, teamAName, teamBName }) {
  if (winner === null) return <span className="text-[10px] text-gray-600 font-semibold">Incomplete</span>
  if (winner === 'halved') return (
    <span className="text-[10px] bg-gray-700/80 text-gray-300 px-2 py-0.5 rounded-full font-bold">
      Halved · ½pt each
    </span>
  )
  if (winner === 'a') return (
    <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-800/50">
      {teamAName} +1
    </span>
  )
  return (
    <span className="text-[10px] bg-red-900/60 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-800/50">
      {teamBName} +1
    </span>
  )
}

function PlayerScoreRow({ playerId, playerName, holeNumber, holePar, scores, dispatch, color, highlight }) {
  const gross = scores[playerId]?.[holeNumber]?.gross ?? null

  function adjust(delta) {
    const newGross = gross != null ? Math.max(1, gross + delta) : holePar
    dispatch({ type: 'SET_SCORE', playerId, holeNumber, gross: Math.max(1, newGross) })
  }

  function clear() {
    dispatch({ type: 'CLEAR_SCORE', playerId, holeNumber })
  }

  const scoreColor = color === 'blue'
    ? (highlight ? 'text-blue-200' : 'text-blue-400')
    : (highlight ? 'text-red-200' : 'text-red-400')

  return (
    <div className={`flex items-center gap-2 py-2 ${highlight ? 'opacity-100' : 'opacity-75'}`}>
      <span className={`flex-1 text-sm min-w-0 truncate ${highlight ? 'text-white font-bold' : 'text-gray-400 font-semibold'}`}>
        {playerName}
        {highlight && gross != null && <span className="ml-1 text-[9px] text-green-400 font-black">★</span>}
      </span>
      <button
        onClick={() => adjust(-1)}
        className="w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 text-white text-xl font-bold flex items-center justify-center active:scale-90 shrink-0"
      >
        −
      </button>
      <div className="w-10 text-center shrink-0">
        {gross != null ? (
          <button onClick={clear} className={`text-2xl font-black ${scoreColor} active:opacity-60`} title="Tap to clear">
            {gross}
          </button>
        ) : (
          <span className="text-2xl font-black text-gray-700">—</span>
        )}
      </div>
      <button
        onClick={() => adjust(+1)}
        className="w-11 h-11 rounded-xl bg-gray-800 border border-gray-700 text-white text-xl font-bold flex items-center justify-center active:scale-90 shrink-0"
      >
        +
      </button>
    </div>
  )
}

function FourballPanel({ match, holeNumber, holePar, state, dispatch, teamA, teamB }) {
  const winner = calcHoleWinner(holeNumber, match, state.scores)
  const getPlayerName = id => state.players.find(p => p.id === id)?.name ?? id

  const aScores = match.teamAPlayerIds.map(id => state.scores[id]?.[holeNumber]?.gross).filter(v => v != null)
  const bScores = match.teamBPlayerIds.map(id => state.scores[id]?.[holeNumber]?.gross).filter(v => v != null)
  const aBest = aScores.length ? Math.min(...aScores) : null
  const bBest = bScores.length ? Math.min(...bScores) : null

  const borderClass =
    winner === 'a' ? 'border-blue-700/60' :
    winner === 'b' ? 'border-red-700/60' :
    winner === 'halved' ? 'border-gray-600/60' :
    'border-gray-800'

  return (
    <div className={`rounded-2xl border overflow-hidden ${borderClass}`}>
      <div className="px-3 py-2 bg-gray-800/60 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{match.name}</span>
        <HoleResultPill winner={winner} teamAName={teamA.name} teamBName={teamB.name} />
      </div>

      {/* Team A */}
      <div className="px-3 pt-2 pb-1 bg-blue-950/25">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{teamA.name}</span>
          {aBest != null && (
            <span className="text-[10px] text-blue-400 font-semibold">Best ball: {aBest}</span>
          )}
        </div>
        {match.teamAPlayerIds.map(id => (
          <PlayerScoreRow
            key={id}
            playerId={id}
            playerName={getPlayerName(id)}
            holeNumber={holeNumber}
            holePar={holePar}
            scores={state.scores}
            dispatch={dispatch}
            color="blue"
            highlight={aBest != null && state.scores[id]?.[holeNumber]?.gross === aBest}
          />
        ))}
      </div>

      <div className="h-px bg-gray-800" />

      {/* Team B */}
      <div className="px-3 pt-2 pb-2 bg-red-950/25">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">{teamB.name}</span>
          {bBest != null && (
            <span className="text-[10px] text-red-400 font-semibold">Best ball: {bBest}</span>
          )}
        </div>
        {match.teamBPlayerIds.map(id => (
          <PlayerScoreRow
            key={id}
            playerId={id}
            playerName={getPlayerName(id)}
            holeNumber={holeNumber}
            holePar={holePar}
            scores={state.scores}
            dispatch={dispatch}
            color="red"
            highlight={bBest != null && state.scores[id]?.[holeNumber]?.gross === bBest}
          />
        ))}
      </div>
    </div>
  )
}

function SinglesPanel({ match, holeNumber, holePar, state, dispatch, teamA, teamB }) {
  const winner = calcHoleWinner(holeNumber, match, state.scores)
  const getPlayerName = id => state.players.find(p => p.id === id)?.name ?? id
  const aId = match.teamAPlayerIds[0]
  const bId = match.teamBPlayerIds[0]

  const borderClass =
    winner === 'a' ? 'border-blue-700/60' :
    winner === 'b' ? 'border-red-700/60' :
    winner === 'halved' ? 'border-gray-600/60' :
    'border-gray-800'

  return (
    <div className={`rounded-xl border overflow-hidden ${borderClass}`}>
      <div className="px-3 py-1.5 bg-gray-800/60 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{match.name}</span>
        <HoleResultPill winner={winner} teamAName={teamA.name} teamBName={teamB.name} />
      </div>
      <div className="px-3 pt-1 pb-1 bg-blue-950/15">
        <PlayerScoreRow
          playerId={aId}
          playerName={getPlayerName(aId)}
          holeNumber={holeNumber}
          holePar={holePar}
          scores={state.scores}
          dispatch={dispatch}
          color="blue"
          highlight={winner === 'a'}
        />
      </div>
      <div className="h-px bg-gray-800" />
      <div className="px-3 pt-1 pb-1 bg-red-950/15">
        <PlayerScoreRow
          playerId={bId}
          playerName={getPlayerName(bId)}
          holeNumber={holeNumber}
          holePar={holePar}
          scores={state.scores}
          dispatch={dispatch}
          color="red"
          highlight={winner === 'b'}
        />
      </div>
    </div>
  )
}

export default function Matches({ state, dispatch, teamA, teamB }) {
  const [holeNum, setHoleNum] = useState(1)
  const touchStart = useRef(null)

  const hole = state.holes.find(h => h.number === holeNum) || { number: holeNum, par: 4 }
  const isBack9 = holeNum >= 10
  const matchesForHole = state.matches.filter(m => holeNum >= m.holeRange[0] && holeNum <= m.holeRange[1])
  const { a: totalA, b: totalB } = calcTotalPoints(state.matches, state.holes, state.scores)
  const holeAgg = getHoleAggregate(holeNum, state.matches, state.scores)

  function prevHole() { setHoleNum(h => Math.max(1, h - 1)) }
  function nextHole() { setHoleNum(h => Math.min(18, h + 1)) }

  function handleTouchStart(e) {
    touchStart.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    if (touchStart.current === null) return
    const dx = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 50) {
      dx > 0 ? nextHole() : prevHole()
    }
    touchStart.current = null
  }

  return (
    <div
      className="min-h-screen bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky tournament bar */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800 px-4 py-2.5 flex items-center">
        <div className="flex-1 text-left">
          <div className="text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none mb-0.5">{teamA.name}</div>
          <div className="text-2xl font-black text-blue-400 leading-none">{fmtPts(totalA)}</div>
        </div>
        <div className="text-center px-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">The Bromsgrove Cup</div>
          <div className="text-[9px] text-gray-700">Need {POINTS_TO_WIN} to win</div>
        </div>
        <div className="flex-1 text-right">
          <div className="text-[10px] text-red-500 font-black uppercase tracking-widest leading-none mb-0.5">{teamB.name}</div>
          <div className="text-2xl font-black text-red-400 leading-none">{fmtPts(totalB)}</div>
        </div>
      </div>

      {/* Hole header */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={prevHole}
            disabled={holeNum === 1}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-30"
          >
            ← H{Math.max(1, holeNum - 1)}
          </button>
          <div className="text-center px-3">
            <div className="text-3xl font-black text-white leading-none">Hole {holeNum}</div>
            <div className="text-sm text-gray-500 mt-0.5">Par {hole.par}</div>
          </div>
          <button
            onClick={nextHole}
            disabled={holeNum === 18}
            className="flex-1 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-30"
          >
            H{Math.min(18, holeNum + 1)} →
          </button>
        </div>

        {/* This-hole points summary */}
        {holeAgg.played > 0 ? (
          <div className="text-center text-xs text-gray-500">
            This hole:&nbsp;
            <span className="text-blue-400 font-bold">{fmtPts(holeAgg.a)}</span>
            <span className="text-gray-600"> – </span>
            <span className="text-red-400 font-bold">{fmtPts(holeAgg.b)}</span>
            <span className="text-gray-600"> &nbsp;({holeAgg.played}/{matchesForHole.length} matches)</span>
          </div>
        ) : (
          <div className="text-center text-xs text-gray-700">No scores entered yet</div>
        )}
      </div>

      {/* Hole strip */}
      <div className="flex overflow-x-auto px-4 py-2 gap-1.5 bg-gray-900/60 border-b border-gray-800">
        {Array.from({ length: 18 }, (_, i) => i + 1).map(h => {
          const agg = getHoleAggregate(h, state.matches, state.scores)
          const dotCls =
            agg.played === 0 ? 'bg-gray-800 text-gray-600' :
            agg.a > agg.b ? 'bg-blue-700 text-white' :
            agg.b > agg.a ? 'bg-red-700 text-white' :
            'bg-gray-600 text-white'
          return (
            <button
              key={h}
              onClick={() => setHoleNum(h)}
              className={`shrink-0 w-9 h-9 rounded-xl text-xs font-black transition-all ${dotCls} ${
                h === holeNum
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-950 scale-110'
                  : 'active:scale-95'
              }`}
            >
              {h}
            </button>
          )
        })}
      </div>

      {/* Section label + match panels */}
      <div className="px-4 pt-3 pb-20">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 whitespace-nowrap">
            {isBack9 ? 'Back 9 — Singles' : 'Front 9 — Fourballs'}
          </span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        <div className="space-y-3">
          {matchesForHole.map(match => (
            match.type === 'fourballs'
              ? <FourballPanel
                  key={match.id}
                  match={match}
                  holeNumber={holeNum}
                  holePar={hole.par}
                  state={state}
                  dispatch={dispatch}
                  teamA={teamA}
                  teamB={teamB}
                />
              : <SinglesPanel
                  key={match.id}
                  match={match}
                  holeNumber={holeNum}
                  holePar={hole.par}
                  state={state}
                  dispatch={dispatch}
                  teamA={teamA}
                  teamB={teamB}
                />
          ))}
        </div>
      </div>
    </div>
  )
}
