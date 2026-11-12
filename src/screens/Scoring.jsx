import { useState, useRef } from 'react'
import {
  getScore, holesPlayed, calcGross,
  getHolePar, getHoleSI, shotsReceived, stablefordPoints, calcPlayerStableford,
  calcHoleMatchResult, calcMatchStatus, matchStatusText,
  getFourballGroupMatchStatus, buildRydercupResult,
} from '../utils/scoring'

const TEAM_COLOR = { 1: 'bg-blue-500', 2: 'bg-red-500' }

function ScoreRow({ player, scores, holeNumber, format, roundPlayer, courseHoles, onScoreChange, onScoreClear }) {
  const score  = getScore(scores, player.id, holeNumber)
  const si     = getHoleSI(courseHoles, holeNumber)
  const par    = getHolePar(courseHoles, holeNumber)
  const shots  = shotsReceived(si, roundPlayer?.playing_handicap ?? 0)
  const isMatch = format === 'match_1v1' || format === 'fourballs'

  function adjust(delta) {
    if (score === null) { onScoreChange(player.id, holeNumber, par); return }
    onScoreChange(player.id, holeNumber, Math.max(1, score + delta))
  }

  const pts = format === 'stableford' ? stablefordPoints(score, par, shots) : null

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-800 last:border-0">
      {isMatch && roundPlayer?.team && (
        <div className={`w-2 h-2 rounded-full shrink-0 ${TEAM_COLOR[roundPlayer.team] ?? 'bg-gray-600'}`} />
      )}

      <div className="flex-1 min-w-0 pr-1">
        <div className="font-bold text-white text-sm truncate leading-tight">{player.name}</div>
        <div className="text-[10px] text-slate-600 leading-tight flex items-center gap-1">
          <span>HCP {roundPlayer?.playing_handicap ?? player.handicap}</span>
          {shots > 0 && <span className="text-green-600">−{shots}</span>}
        </div>
      </div>

      <button
        onClick={() => adjust(-1)}
        className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        −
      </button>

      <div className="w-10 text-center shrink-0">
        {score !== null ? (
          <button
            onClick={() => onScoreClear(player.id, holeNumber)}
            className="text-2xl font-black text-emerald-400 active:opacity-50 w-full leading-none"
            title="Tap to clear"
          >
            {score}
          </button>
        ) : (
          <span className="text-2xl font-black text-slate-700 leading-none">—</span>
        )}
      </div>

      <button
        onClick={() => adjust(+1)}
        className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        +
      </button>

      {format === 'stableford' && (
        <div className="w-10 text-center shrink-0">
          {pts !== null ? (
            <div className={`text-sm font-black leading-none ${pts >= 2 ? 'text-emerald-400' : pts === 1 ? 'text-yellow-400' : 'text-slate-600'}`}>
              {pts}★
            </div>
          ) : (
            <div className="text-sm text-slate-700">—</div>
          )}
        </div>
      )}
    </div>
  )
}

function ScramblePairRow({ teamRPs, players, scores, holeNumber, courseHoles, onScoreChange, onScoreClear, teamNum }) {
  const player1 = players.find(p => p.id === teamRPs[0]?.player_id)
  const player2 = players.find(p => p.id === teamRPs[1]?.player_id)
  if (!player1) return null

  const score = getScore(scores, player1.id, holeNumber)
  const par   = getHolePar(courseHoles, holeNumber)
  const hcpA  = teamRPs[0]?.playing_handicap ?? 0
  const hcpB  = teamRPs[1]?.playing_handicap ?? hcpA
  const lo    = Math.min(hcpA, hcpB)
  const hi    = Math.max(hcpA, hcpB)
  const teamHcp = teamRPs.length >= 2 ? Math.round(0.6 * lo + 0.4 * hi) : hcpA

  function adjust(delta) {
    const next = score === null ? par : Math.max(1, score + delta)
    teamRPs.forEach(rp => onScoreChange(rp.player_id, holeNumber, next))
  }
  function clear() {
    teamRPs.forEach(rp => onScoreClear(rp.player_id, holeNumber))
  }

  const color = teamNum === 1 ? 'text-emerald-400' : 'text-sky-400'
  const dot   = teamNum === 1 ? 'bg-emerald-500' : 'bg-sky-500'

  return (
    <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-800 last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0 pr-1">
        <div className={`font-bold text-sm truncate leading-tight ${color}`}>
          {player1.name}{player2 ? ` & ${player2.name}` : ''}
        </div>
        <div className="text-[10px] text-slate-600 leading-tight">Team HCP {teamHcp}</div>
      </div>
      <button
        onClick={() => adjust(-1)}
        className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        −
      </button>
      <div className="w-10 text-center shrink-0">
        {score !== null ? (
          <button onClick={clear} className="text-2xl font-black text-emerald-400 active:opacity-50 w-full leading-none" title="Tap to clear">
            {score}
          </button>
        ) : (
          <span className="text-2xl font-black text-slate-700 leading-none">—</span>
        )}
      </div>
      <button
        onClick={() => adjust(+1)}
        className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 text-white text-2xl font-bold flex items-center justify-center active:scale-90 active:bg-gray-700 shrink-0"
      >
        +
      </button>
    </div>
  )
}

export default function Scoring({ round, players, roundPlayers, courseHoles, scores, onBack, onLeaderboard, onScoreChange, onScoreClear }) {
  const [holeNum, setHoleNum]           = useState(1)
  const [activeFourball, setActiveFourball] = useState(1)
  const touchStart = useRef(null)
  const totalHoles   = round?.holes ?? 18
  const format       = round?.format ?? 'stroke'
  const isMatch      = format === 'match_1v1' || format === 'fourballs'
  const isTournament = format === 'ryder_cup' || format === 'team_stroke' || format === 'scramble'
  const team1Name    = round?.team1_name ?? 'Team 1'
  const team2Name    = round?.team2_name ?? 'Team 2'

  // For tournament formats: filter to active fourball
  const groups = isTournament
    ? [...new Set(roundPlayers.map(rp => rp.group_num).filter(Boolean))].sort((a, b) => a - b)
    : []
  const displayedRPs = isTournament
    ? roundPlayers.filter(rp => rp.group_num === activeFourball)
    : roundPlayers
  const displayedPlayers = isTournament
    ? players.filter(p => displayedRPs.some(rp => rp.player_id === p.id))
    : players

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

  // Individual match play status
  const holeResults = isMatch
    ? Array.from({ length: totalHoles }, (_, i) => calcHoleMatchResult(i + 1, scores, roundPlayers, courseHoles))
    : null
  const matchStatus = isMatch ? calcMatchStatus(holeResults, totalHoles) : null
  const teamA = isMatch ? roundPlayers.filter(rp => rp.team === 1) : []
  const teamB = isMatch ? roundPlayers.filter(rp => rp.team === 2) : []
  const sideAName = format === 'match_1v1'
    ? (players.find(p => p.id === teamA[0]?.player_id)?.name ?? 'Side A')
    : 'Team A'
  const sideBName = format === 'match_1v1'
    ? (players.find(p => p.id === teamB[0]?.player_id)?.name ?? 'Side B')
    : 'Team B'
  const currentHoleResult = isMatch ? holeResults?.[holeNum - 1] : null

  // Tournament: per-fourball match status (ryder_cup / team_stroke)
  const fbMatchStatus = (format === 'ryder_cup' || format === 'team_stroke')
    ? getFourballGroupMatchStatus(scores, roundPlayers, players, courseHoles, activeFourball, totalHoles)
    : null
  const fbHoleResults = (format === 'ryder_cup' || format === 'team_stroke') ? fbMatchStatus?.holeResults : null
  // Current hole result for active fourball
  const fbCurrentHoleResult = fbMatchStatus
    ? (() => {
        // recalculate per-hole for display
        const si  = getHoleSI(courseHoles, holeNum)
        const dRPs = roundPlayers.filter(rp => rp.group_num === activeFourball)
        const t1 = dRPs.filter(rp => rp.team === 1)
        const t2 = dRPs.filter(rp => rp.team === 2)
        const bestNet = (team) => {
          const nets = team.map(rp => {
            const s = scores.find(sc => sc.player_id === rp.player_id && sc.hole_number === holeNum)
            return s ? s.strokes - shotsReceived(si, rp.playing_handicap) : null
          }).filter(n => n !== null)
          return nets.length === team.length ? Math.min(...nets) : null
        }
        const nA = bestNet(t1), nB = bestNet(t2)
        if (nA === null || nB === null) return null
        return nA < nB ? 'a' : nA > nB ? 'b' : 'halved'
      })()
    : null

  // Ryder Cup overall score
  const rydercupResult = format === 'ryder_cup'
    ? buildRydercupResult(scores, roundPlayers, players, courseHoles, round)
    : null

  const enteredThisHole = displayedPlayers.filter(p => getScore(scores, p.id, holeNum) !== null).length

  return (
    <div
      className="min-h-screen md:min-h-0 bg-slate-950 md:rounded-2xl md:overflow-hidden md:shadow-2xl"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center px-3 py-3 gap-2">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-slate-400 active:scale-90 text-lg shrink-0">
            ←
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="font-black text-white text-sm leading-tight truncate">{round.course_name ?? dateStr}</div>
            <div className="text-[10px] text-slate-500">
              {dateStr} · {totalHoles} holes
            </div>
          </div>
          <button
            onClick={onLeaderboard}
            className="w-9 h-9 flex items-center justify-center text-lg text-emerald-400 active:scale-90 shrink-0"
            title="View leaderboard"
          >
            🏆
          </button>
        </div>

        {/* Tournament: fourball selector tabs */}
        {isTournament && groups.length > 1 && (
          <div className="flex overflow-x-auto px-3 pb-2 gap-1.5 no-scrollbar">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setActiveFourball(g)}
                className={`shrink-0 px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 ${
                  activeFourball === g
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                FB {g}
              </button>
            ))}
          </div>
        )}

        {/* Hole strip */}
        <div className="flex overflow-x-auto px-3 pb-2.5 gap-1.5 no-scrollbar">
          {Array.from({ length: totalHoles }, (_, i) => i + 1).map(h => {
            const entered = displayedPlayers.filter(p => getScore(scores, p.id, h) !== null).length
            const full    = entered === displayedPlayers.length && displayedPlayers.length > 0
            const partial = entered > 0 && !full
            const result  = isMatch ? holeResults?.[h - 1] : null
            const done    = isMatch ? result !== null : full
            const partial2 = isMatch ? partial : partial
            return (
              <button
                key={h}
                onClick={() => setHoleNum(h)}
                className={`shrink-0 w-9 h-9 rounded-xl text-xs font-black transition-all
                  ${done ? 'bg-green-700 text-white' : partial2 ? 'bg-yellow-700/80 text-white' : 'bg-slate-800 text-slate-500'}
                  ${h === holeNum ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-950 scale-110' : 'active:scale-95'}
                `}
              >
                {h}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ryder Cup: overall team score banner */}
      {format === 'ryder_cup' && rydercupResult && (
        <div className="mx-4 mt-3 bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-2">Overall Score</div>
          <div className="flex items-center justify-between gap-2">
            <div className={`flex-1 text-center ${rydercupResult.team1Points > rydercupResult.team2Points ? 'text-emerald-400' : 'text-slate-400'}`}>
              <div className="text-2xl font-black leading-none">{rydercupResult.team1Points}</div>
              <div className="text-[10px] mt-0.5 truncate">{team1Name}</div>
            </div>
            <div className="text-slate-700 font-black text-lg">—</div>
            <div className={`flex-1 text-center ${rydercupResult.team2Points > rydercupResult.team1Points ? 'text-sky-400' : 'text-slate-400'}`}>
              <div className="text-2xl font-black leading-none">{rydercupResult.team2Points}</div>
              <div className="text-[10px] mt-0.5 truncate">{team2Name}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament (ryder_cup): per-fourball match status */}
      {format === 'ryder_cup' && fbMatchStatus && (
        <div className="mx-4 mt-2 bg-slate-900/60 rounded-2xl border border-slate-800 px-4 py-2 text-center">
          <div className="text-xs font-black text-white">
            {matchStatusText(fbMatchStatus, team1Name, team2Name)} · FB {activeFourball}
          </div>
        </div>
      )}

      {/* Individual match status strip */}
      {isMatch && matchStatus && (
        <div className="mx-4 mt-3 bg-slate-900 rounded-2xl border border-slate-800 px-4 py-2.5 text-center">
          <div className="text-sm font-black text-white">
            {matchStatusText(matchStatus, sideAName, sideBName)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            <span className="text-blue-400">{sideAName}</span>
            {' vs '}
            <span className="text-red-400">{sideBName}</span>
          </div>
        </div>
      )}

      {/* Stableford totals strip */}
      {format === 'stableford' && displayedPlayers.length > 0 && (
        <div className="mx-4 mt-3 flex gap-1.5 flex-wrap">
          {displayedPlayers.map(p => {
            const rp = displayedRPs.find(r => r.player_id === p.id)
            const pts = calcPlayerStableford(scores, p.id, courseHoles, rp)
            return (
              <div key={p.id} className="bg-slate-900 rounded-xl px-3 py-1.5 border border-slate-800">
                <span className="text-xs text-slate-400">{p.name.split(' ')[0]}</span>
                <span className="text-xs font-black text-emerald-400 ml-1.5">{pts}★</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Stroke/team_stroke totals strip */}
      {(format === 'stroke' || format === 'team_stroke') && displayedPlayers.length > 0 && (
        <div className="mx-4 mt-3 flex gap-1.5 flex-wrap">
          {displayedPlayers.map(p => {
            const rp     = displayedRPs.find(r => r.player_id === p.id)
            const gross  = calcGross(scores, p.id)
            const played = holesPlayed(scores, p.id)
            const hcp    = rp?.playing_handicap ?? p.handicap
            const teamNum = rp?.team
            const pill = teamNum === 1
              ? 'border-emerald-800/50 text-emerald-500'
              : teamNum === 2
              ? 'border-sky-800/50 text-sky-400'
              : 'border-slate-800 text-slate-400'
            return (
              <div key={p.id} className={`bg-slate-900 rounded-xl px-3 py-1.5 border ${pill}`}>
                <span className="text-xs">{p.name.split(' ')[0]}</span>
                {played > 0
                  ? <span className="text-xs font-black text-emerald-400 ml-1.5">{gross - hcp}</span>
                  : <span className="text-xs text-slate-700 ml-1.5">—</span>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* Scramble totals strip */}
      {format === 'scramble' && displayedPlayers.length > 0 && (
        <div className="mx-4 mt-3 flex gap-1.5 flex-wrap">
          {[1, 2].map(teamNum => {
            const teamRPs = displayedRPs.filter(rp => rp.team === teamNum)
            if (!teamRPs.length) return null
            const hcpA = teamRPs[0]?.playing_handicap ?? 0
            const hcpB = teamRPs[1]?.playing_handicap ?? hcpA
            const teamHcp = teamRPs.length >= 2 ? Math.round(0.6 * Math.min(hcpA, hcpB) + 0.4 * Math.max(hcpA, hcpB)) : hcpA
            const firstId = teamRPs[0]?.player_id
            const gross   = firstId ? calcGross(scores, firstId) : 0
            const played  = firstId ? holesPlayed(scores, firstId) : 0
            const pill    = teamNum === 1 ? 'border-emerald-800/50' : 'border-sky-800/50'
            const val     = teamNum === 1 ? 'text-emerald-400' : 'text-sky-400'
            return (
              <div key={teamNum} className={`bg-slate-900 rounded-xl px-3 py-1.5 border ${pill}`}>
                <span className="text-xs text-slate-400">Team {teamNum}</span>
                {played > 0
                  ? <span className={`text-xs font-black ml-1.5 ${val}`}>{gross - teamHcp}</span>
                  : <span className="text-xs text-slate-700 ml-1.5">—</span>
                }
              </div>
            )
          })}
        </div>
      )}

      {/* Hole navigation */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={prevHole}
          disabled={holeNum === 1}
          className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm active:scale-95 disabled:opacity-25 transition-all"
        >
          ← H{Math.max(1, holeNum - 1)}
        </button>
        <div className="text-center px-2 shrink-0">
          <div className="text-3xl font-black text-white leading-none">Hole {holeNum}</div>
          <div className="text-xs text-slate-600 mt-1">
            Par {getHolePar(courseHoles, holeNum)} · SI {getHoleSI(courseHoles, holeNum)}
          </div>
          <div className="text-[10px] text-slate-700 mt-0.5">{enteredThisHole}/{players.length} entered</div>
        </div>
        <button
          onClick={nextHole}
          disabled={holeNum === totalHoles}
          className="flex-1 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-sm active:scale-95 disabled:opacity-25 transition-all"
        >
          H{Math.min(totalHoles, holeNum + 1)} →
        </button>
      </div>

      {/* Player score rows */}
      {displayedPlayers.length === 0 ? (
        <div className="text-center py-12 text-slate-600 text-sm px-4">
          No players assigned to this round.
        </div>
      ) : format === 'scramble' ? (
        <div className="mx-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {[1, 2].map(teamNum => {
            const teamRPs = displayedRPs.filter(rp => rp.team === teamNum)
            if (!teamRPs.length) return null
            return (
              <ScramblePairRow
                key={teamNum}
                teamRPs={teamRPs}
                players={players}
                scores={scores}
                holeNumber={holeNum}
                courseHoles={courseHoles}
                onScoreChange={onScoreChange}
                onScoreClear={onScoreClear}
                teamNum={teamNum}
              />
            )
          })}
        </div>
      ) : (
        <div className="mx-4 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          {displayedPlayers.map(player => {
            const rp = displayedRPs.find(r => r.player_id === player.id)
            return (
              <ScoreRow
                key={player.id}
                player={player}
                scores={scores}
                holeNumber={holeNum}
                format={format}
                roundPlayer={rp}
                courseHoles={courseHoles}
                onScoreChange={onScoreChange}
                onScoreClear={onScoreClear}
              />
            )
          })}
        </div>
      )}

      {/* Hole result chip — individual match play */}
      {isMatch && (
        <div className="mx-4 mt-2 py-2 text-center">
          {currentHoleResult === null && (
            <span className="text-xs text-slate-700">Hole {holeNum} — awaiting scores</span>
          )}
          {currentHoleResult === 'halved' && (
            <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1 rounded-full">Hole {holeNum} — Halved</span>
          )}
          {currentHoleResult === 'a' && (
            <span className="text-xs font-black text-blue-300 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-700/40">
              Hole {holeNum} — {sideAName} wins
            </span>
          )}
          {currentHoleResult === 'b' && (
            <span className="text-xs font-black text-red-300 bg-red-900/40 px-3 py-1 rounded-full border border-red-700/40">
              Hole {holeNum} — {sideBName} wins
            </span>
          )}
        </div>
      )}

      {/* Hole result chip — ryder_cup / team_stroke fourball */}
      {(format === 'ryder_cup' || format === 'team_stroke') && (
        <div className="mx-4 mt-2 py-2 text-center">
          {fbCurrentHoleResult === null && (
            <span className="text-xs text-slate-700">Hole {holeNum} — awaiting all scores</span>
          )}
          {fbCurrentHoleResult === 'halved' && (
            <span className="text-xs font-black text-slate-400 bg-slate-800 px-3 py-1 rounded-full">Hole {holeNum} — Halved</span>
          )}
          {fbCurrentHoleResult === 'a' && (
            <span className="text-xs font-black text-emerald-300 bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-700/40">
              Hole {holeNum} — {team1Name} wins
            </span>
          )}
          {fbCurrentHoleResult === 'b' && (
            <span className="text-xs font-black text-sky-300 bg-sky-900/40 px-3 py-1 rounded-full border border-sky-700/40">
              Hole {holeNum} — {team2Name} wins
            </span>
          )}
        </div>
      )}

      <div className="px-4 pt-2 pb-6">
        <p className="text-[10px] text-slate-700 text-center">
          Tap a score to clear it · Swipe to change hole
        </p>
      </div>
    </div>
  )
}
