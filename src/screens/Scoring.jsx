import { useState, useRef } from 'react'
import { getScore, holesPlayed } from '../utils/scoring'

function ScoreRow({ player, scores, holeNumber, onScoreChange, onScoreClear }) {
  const score = getScore(scores, player.id, holeNumber)

  function adjust(delta) {
    if (score === null) {
      // First tap of either button → set to 4 (par-ish default)
      onScoreChange(player.id, holeNumber, 4)
      return
    }
    onScoreChange(player.id, holeNumber, Math.max(1, score + delta))
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0">
      <div className="flex-1 min-w-0 pr-1">
        <div className="font-bold text-white text-sm truncate leading-tight">{player.name}</div>
        <div className="text-[10px] text-gray-600 leading-tight">HCP {player.handicap}</div>
      </div>

      <button
        onClick={() => adjust(-1)}
        className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        −
      </button>

      <div className="w-11 text-center shrink-0">
        {score !== null ? (
          <button
            onClick={() => onScoreClear(player.id, holeNumber)}
            className="text-2xl font-black text-green-400 active:opacity-50 w-full leading-none"
            title="Tap to clear"
          >
            {score}
          </button>
        ) : (
          <span className="text-2xl font-black text-gray-700 leading-none">—</span>
        )}
      </div>

      <button
        onClick={() => adjust(+1)}
        className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        +
      </button>
    </div>
  )
}

export default function Scoring({ round, players, scores, onBack, onLeaderboard, onScoreChange, onScoreClear }) {
  const [holeNum, setHoleNum] = useState(1)
  const touchStart = useRef(null)
  const totalHoles = round?.holes ?? 18

  function prevHole() { setHoleNum(h => Math.max(1, h - 1)) }
  function nextHole() { setHoleNum(h => Math.min(totalHoles, h + 1)) }

  function handleTouchStart(e) { touchStart.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    if (touchStart.current === null) return
    const dx = touchStart.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 50) dx > 0 ? nextHole() : prevHole()
    touchStart.current = null
  }

  if (!round) return null

  const dateStr = new Date(round.date + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const enteredThisHole = players.filter(p => getScore(scores, p.id, holeNum) !== null).length

  return (
    <div
      className="min-h-screen bg-gray-950"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center px-3 py-3 gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-gray-400 active:scale-90 text-lg shrink-0">
            ←
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="font-black text-white text-sm leading-tight truncate">{round.course}</div>
            <div className="text-[10px] text-gray-500">{dateStr} · {totalHoles} holes</div>
          </div>
          <button
            onClick={onLeaderboard}
            className="w-9 h-9 flex items-center justify-center text-lg text-green-400 active:scale-90 shrink-0"
            title="View leaderboard"
          >
            🏆
          </button>
        </div>

        {/* Hole strip */}
        <div className="flex overflow-x-auto px-3 pb-2.5 gap-1.5 no-scrollbar">
          {Array.from({ length: totalHoles }, (_, i) => i + 1).map(h => {
            const entered = players.filter(p => getScore(scores, p.id, h) !== null).length
            const full    = entered === players.length && players.length > 0
            const partial = entered > 0 && !full
            return (
              <button
                key={h}
                onClick={() => setHoleNum(h)}
                className={`shrink-0 w-9 h-9 rounded-xl text-xs font-black transition-all
                  ${full ? 'bg-green-700 text-white' : partial ? 'bg-yellow-700/80 text-white' : 'bg-gray-800 text-gray-500'}
                  ${h === holeNum ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-950 scale-110' : 'active:scale-95'}
                `}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* Hole navigation */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={prevHole}
          disabled={holeNum === 1}
          className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-25 transition-all"
        >
          ← H{Math.max(1, holeNum - 1)}
        </button>
        <div className="text-center px-2 shrink-0">
          <div className="text-3xl font-black text-white leading-none">Hole {holeNum}</div>
          <div className="text-xs text-gray-600 mt-1">{enteredThisHole}/{players.length} entered</div>
        </div>
        <button
          onClick={nextHole}
          disabled={holeNum === totalHoles}
          className="flex-1 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white font-bold text-sm active:scale-95 disabled:opacity-25 transition-all"
        >
          H{Math.min(totalHoles, holeNum + 1)} →
        </button>
      </div>

      {/* Player score rows */}
      {players.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm px-4">
          No players set up yet.{' '}
          <span className="text-gray-500">Go to Players tab to add the group.</span>
        </div>
      ) : (
        <div className="mx-4 bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {players.map(player => (
            <ScoreRow
              key={player.id}
              player={player}
              scores={scores}
              holeNumber={holeNum}
              onScoreChange={onScoreChange}
              onScoreClear={onScoreClear}
            />
          ))}
        </div>
      )}

      <div className="px-4 pt-3 pb-6">
        <p className="text-[10px] text-gray-700 text-center">
          Tap a score to clear it · Swipe to change hole
        </p>
      </div>
    </div>
  )
}
