import { useState } from 'react'
import {
  buildRoundLeaderboard, buildStablefordLeaderboard,
  calcHoleMatchResult, calcMatchStatus, matchStatusText,
  buildRydercupResult, buildTeamStrokeResult,
  getFourballGroupMatchStatus,
} from '../utils/scoring'

const MEDAL = ['🥇', '🥈', '🥉']

const FORMAT_LABELS = {
  stroke:      'Stroke Play',
  stableford:  'Stableford',
  match_1v1:   'Match Play',
  fourballs:   'Fourballs',
  ryder_cup:   'Ryder Cup',
  team_stroke: 'Team Stroke',
}

export default function RoundLeaderboard({ round, players, roundPlayers, courseHoles, courses, scores, onBack, onScoring }) {
  const [lbTab, setLbTab] = useState('match')

  const format       = round?.format ?? 'stroke'
  const isMatch      = format === 'match_1v1' || format === 'fourballs'
  const isTournament = format === 'ryder_cup' || format === 'team_stroke'
  const totalHoles   = round?.holes ?? 18
  const team1Name    = round?.team1_name ?? 'Team 1'
  const team2Name    = round?.team2_name ?? 'Team 2'

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

  // Stroke leaderboard for the match/ryder_cup stroke tab
  const matchStrokeLb = (format === 'fourballs' || format === 'ryder_cup')
    ? buildRoundLeaderboard(scores, players, roundPlayers)
    : null

  // Individual leaderboards
  const strokeLb = (!isMatch && !isTournament && format !== 'stableford')
    ? buildRoundLeaderboard(scores, players, roundPlayers)
    : null

  const stableLb = format === 'stableford'
    ? buildStablefordLeaderboard(scores, players, roundPlayers, courseHoles)
    : null

  // Tournament results
  const rydercupResult  = format === 'ryder_cup'
    ? buildRydercupResult(scores, roundPlayers, players, courseHoles, round)
    : null

  const teamStrokeResult = format === 'team_stroke'
    ? buildTeamStrokeResult(scores, roundPlayers, players)
    : null

  // Groups for ryder_cup fourballs
  const groups = isTournament
    ? [...new Set(roundPlayers.map(rp => rp.group_num).filter(Boolean))].sort((a, b) => a - b)
    : []

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-6 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-slate-400 active:scale-90 text-lg shrink-0">←</button>
          <div className="flex-1 text-center min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{dateStr}</div>
            <h1 className="text-xl font-black text-white truncate">{courseName}</h1>
            <div className="text-xs text-slate-600">
              {totalHoles} holes · {FORMAT_LABELS[format] ?? 'Stroke Play'}
            </div>
          </div>
          <button
            onClick={onScoring}
            className="w-9 h-9 flex items-center justify-center text-emerald-400 active:scale-90 text-lg shrink-0"
            title="Back to scoring"
          >
            ⛳
          </button>
        </div>
      </div>

      {/* Tab switcher for fourballs/ryder_cup */}
      {(format === 'fourballs' || format === 'ryder_cup') && (
        <div className="px-4 pt-4">
          <div className="flex gap-1 p-1 bg-slate-900 rounded-2xl border border-slate-800">
            {[{ id: 'match', label: 'Match Play' }, { id: 'stroke', label: 'Stroke Play' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setLbTab(tab.id)}
                className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 ${
                  lbTab === tab.id ? 'bg-emerald-500 text-white' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 pt-4 pb-10">

        {/* Match play result */}
        {isMatch && matchStatus && (format === 'match_1v1' || lbTab === 'match') && (
          <div className="mb-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Match Result</div>
              <div className="text-xl font-black text-white mb-1">
                {matchStatusText(matchStatus, sideAName, sideBName)}
              </div>
              <div className="text-xs text-slate-500">
                {matchStatus.played} holes played
                {matchStatus.remaining > 0 && !matchStatus.finished ? ` · ${matchStatus.remaining} remaining` : ''}
              </div>
            </div>

            {/* Hole-by-hole summary */}
            {matchStatus.played > 0 && (
              <div className="mt-3 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2 border-b border-slate-800 flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <div className="flex-1">{sideAName}</div>
                  <div className="w-8 text-center">H</div>
                  <div className="flex-1 text-right">{sideBName}</div>
                </div>
                {holeResults?.map((result, i) => result !== null && (
                  <div key={i} className="px-4 py-1.5 border-b border-slate-800 last:border-0 flex items-center gap-2 text-xs">
                    <div className={`flex-1 font-bold ${result === 'a' ? 'text-blue-300' : 'text-slate-600'}`}>
                      {result === 'a' ? '●' : ''}
                    </div>
                    <div className="w-8 text-center text-slate-500 font-bold">{i + 1}</div>
                    <div className={`flex-1 text-right font-bold ${result === 'b' ? 'text-red-300' : result === 'halved' ? 'text-slate-400' : 'text-slate-600'}`}>
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
            <div className="text-center py-16 text-slate-600 text-sm">
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
                      i === 0 && ranked ? 'bg-amber-950/30 border-amber-700/40' :
                      i === 1 && ranked ? 'bg-slate-800/40 border-slate-600/40' :
                      i === 2 && ranked ? 'bg-amber-950/20 border-amber-800/30' :
                      'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="w-9 text-center shrink-0">
                      {ranked && i < 3
                        ? <span className="text-xl">{MEDAL[i]}</span>
                        : <span className={`text-sm font-black ${ranked ? 'text-slate-400' : 'text-slate-700'}`}>
                            {ranked ? i + 1 : '—'}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm truncate">{entry.player.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {entry.played} hole{entry.played !== 1 ? 's' : ''} · HCP {entry.playingHandicap}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ranked ? (
                        <>
                          <div className="text-2xl font-black text-emerald-400 leading-none">{entry.net}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Gross {entry.gross}</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-700">No scores</div>
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
            <div className="text-center py-16 text-slate-600 text-sm">
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
                      i === 0 && ranked ? 'bg-amber-950/30 border-amber-700/40' :
                      i === 1 && ranked ? 'bg-slate-800/40 border-slate-600/40' :
                      i === 2 && ranked ? 'bg-amber-950/20 border-amber-800/30' :
                      'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="w-9 text-center shrink-0">
                      {ranked && i < 3
                        ? <span className="text-xl">{MEDAL[i]}</span>
                        : <span className={`text-sm font-black ${ranked ? 'text-slate-400' : 'text-slate-700'}`}>
                            {ranked ? i + 1 : '—'}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm truncate">{entry.player.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {entry.played} hole{entry.played !== 1 ? 's' : ''} · HCP {entry.playingHandicap}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ranked ? (
                        <>
                          <div className="text-2xl font-black text-emerald-400 leading-none">{entry.points}★</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">points</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-700">No scores</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Ryder Cup result */}
        {format === 'ryder_cup' && rydercupResult && lbTab === 'match' && (
          <div>
            {/* Overall team score */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-3">Overall Score</div>
              <div className="flex items-center justify-around gap-4">
                <div className={`text-center ${rydercupResult.team1Points >= rydercupResult.team2Points ? 'text-emerald-400' : 'text-slate-400'}`}>
                  <div className="text-5xl font-black leading-none">{rydercupResult.team1Points}</div>
                  <div className="text-sm font-black mt-1">{team1Name}</div>
                </div>
                <div className="text-slate-700 text-3xl font-black">—</div>
                <div className={`text-center ${rydercupResult.team2Points >= rydercupResult.team1Points ? 'text-sky-400' : 'text-slate-400'}`}>
                  <div className="text-5xl font-black leading-none">{rydercupResult.team2Points}</div>
                  <div className="text-sm font-black mt-1">{team2Name}</div>
                </div>
              </div>
              {rydercupResult.team1Points !== rydercupResult.team2Points && (
                <div className="text-center mt-3 text-sm font-black text-white">
                  {rydercupResult.team1Points > rydercupResult.team2Points ? team1Name : team2Name} leads
                </div>
              )}
            </div>

            {/* Per-fourball results */}
            <div className="space-y-3">
              {rydercupResult.fourballs.map(fb => {
                const groupRPs = roundPlayers.filter(rp => rp.group_num === fb.groupNum)
                const t1Players = groupRPs.filter(rp => rp.team === 1).map(rp => players.find(p => p.id === rp.player_id)).filter(Boolean)
                const t2Players = groupRPs.filter(rp => rp.team === 2).map(rp => players.find(p => p.id === rp.player_id)).filter(Boolean)
                const ms = fb.matchResult
                return (
                  <div key={fb.groupNum} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                      <div className="text-xs font-black text-slate-400">Fourball {fb.groupNum}</div>
                      <div className={`text-xs font-black ${
                        fb.pts1 > fb.pts2 ? 'text-emerald-400' :
                        fb.pts2 > fb.pts1 ? 'text-sky-400' :
                        'text-slate-500'
                      }`}>
                        {fb.pts1 > fb.pts2 ? `${team1Name} +1` :
                         fb.pts2 > fb.pts1 ? `${team2Name} +1` :
                         ms?.played > 0 ? 'Halved ½' : 'In progress'}
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <div className="grid grid-cols-2 gap-3 mb-2">
                        <div>
                          <div className="text-[10px] text-emerald-500 font-bold mb-1">{team1Name}</div>
                          {t1Players.map(p => <div key={p.id} className="text-xs text-white truncate">{p.name}</div>)}
                        </div>
                        <div>
                          <div className="text-[10px] text-sky-400 font-bold mb-1">{team2Name}</div>
                          {t2Players.map(p => <div key={p.id} className="text-xs text-white truncate">{p.name}</div>)}
                        </div>
                      </div>
                      {ms && ms.played > 0 && (
                        <div className="text-xs text-slate-500 mt-1">
                          {matchStatusText(ms, team1Name, team2Name)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Team stroke result */}
        {format === 'team_stroke' && teamStrokeResult && (
          <div>
            {/* Team totals */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mb-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-center mb-3">Team Totals</div>
              <div className="flex gap-3">
                <div className={`flex-1 rounded-xl p-3 text-center ${
                  teamStrokeResult.team1Total <= teamStrokeResult.team2Total
                    ? 'bg-emerald-900/30 border border-emerald-800/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}>
                  <div className={`text-3xl font-black leading-none ${teamStrokeResult.team1Total <= teamStrokeResult.team2Total ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {teamStrokeResult.team1Entries.some(e => e.net !== null) ? teamStrokeResult.team1Total : '—'}
                  </div>
                  <div className="text-xs font-black text-slate-300 mt-1">{team1Name}</div>
                </div>
                <div className={`flex-1 rounded-xl p-3 text-center ${
                  teamStrokeResult.team2Total < teamStrokeResult.team1Total
                    ? 'bg-sky-900/30 border border-sky-800/40'
                    : 'bg-slate-800 border border-slate-700'
                }`}>
                  <div className={`text-3xl font-black leading-none ${teamStrokeResult.team2Total < teamStrokeResult.team1Total ? 'text-sky-400' : 'text-slate-400'}`}>
                    {teamStrokeResult.team2Entries.some(e => e.net !== null) ? teamStrokeResult.team2Total : '—'}
                  </div>
                  <div className="text-xs font-black text-slate-300 mt-1">{team2Name}</div>
                </div>
              </div>
            </div>

            {/* Individual rows grouped by team */}
            {[
              { name: team1Name, entries: teamStrokeResult.team1Entries, color: 'text-emerald-500' },
              { name: team2Name, entries: teamStrokeResult.team2Entries, color: 'text-sky-400' },
            ].map(({ name, entries, color }) => (
              <div key={name} className="mb-3">
                <div className={`text-[10px] font-black uppercase tracking-widest ${color} mb-2 px-1`}>{name}</div>
                <div className="space-y-1.5">
                  {entries.map((entry, i) => (
                    <div key={entry.player.id} className="bg-slate-900 rounded-xl border border-slate-800 px-4 py-2.5 flex items-center gap-3">
                      <div className="w-5 text-center shrink-0">
                        {i < 3 ? <span className="text-sm">{MEDAL[i]}</span> : <span className="text-xs text-slate-600">{i + 1}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{entry.player.name}</div>
                        <div className="text-[10px] text-slate-500">HCP {entry.hcp}</div>
                      </div>
                      <div className="text-right shrink-0">
                        {entry.net !== null ? (
                          <div className="text-xl font-black text-emerald-400 leading-none">{entry.net}</div>
                        ) : (
                          <div className="text-sm text-slate-700">No scores</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stroke Play tab for fourballs / ryder_cup */}
        {matchStrokeLb && lbTab === 'stroke' && (
          matchStrokeLb.every(e => e.net === null) ? (
            <div className="text-center py-16 text-slate-600 text-sm">
              <div className="text-4xl mb-3">📋</div>
              No scores entered yet
            </div>
          ) : (
            <div className="space-y-2">
              {matchStrokeLb.map((entry, i) => {
                const ranked = entry.net !== null
                const rp = roundPlayers.find(rp => rp.player_id === entry.player.id)
                const fbLabel = rp?.group_num ? `FB${rp.group_num}` : null
                return (
                  <div
                    key={entry.player.id}
                    className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 ${
                      i === 0 && ranked ? 'bg-amber-950/30 border-amber-700/40' :
                      i === 1 && ranked ? 'bg-slate-800/40 border-slate-600/40' :
                      i === 2 && ranked ? 'bg-amber-950/20 border-amber-800/30' :
                      'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="w-9 text-center shrink-0">
                      {ranked && i < 3
                        ? <span className="text-xl">{MEDAL[i]}</span>
                        : <span className={`text-sm font-black ${ranked ? 'text-slate-400' : 'text-slate-700'}`}>
                            {ranked ? i + 1 : '—'}
                          </span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-white text-sm truncate">{entry.player.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {entry.played} holes · HCP {entry.playingHandicap}
                        {fbLabel && <span className="ml-1.5 text-slate-600">{fbLabel}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      {ranked ? (
                        <>
                          <div className="text-2xl font-black text-emerald-400 leading-none">{entry.net}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">Gross {entry.gross}</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-700">No scores</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        <p className="text-[10px] text-slate-700 text-center mt-5">
          {format === 'stableford' ? 'Higher points wins' :
           format === 'ryder_cup' ? 'Win=1pt · Halve=0.5pt · Lose=0pt per fourball' :
           format === 'team_stroke' ? 'Net = gross − playing handicap · lower wins' :
           isMatch ? 'Net score per hole · handicap from stroke index' :
           'Net = gross − playing handicap · lower wins'}
        </p>
      </div>
    </div>
  )
}
