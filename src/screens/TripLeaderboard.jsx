import { useState, useEffect } from 'react'
import { fetchAllScores, fetchAllRoundPlayers } from '../lib/supabase'
import { buildTripLeaderboard } from '../utils/scoring'

const MEDAL = ['🥇', '🥈', '🥉']

export default function TripLeaderboard({ players, rounds }) {
  const [allScores, setAllScores]           = useState([])
  const [allRoundPlayers, setAllRoundPlayers] = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAllScores(), fetchAllRoundPlayers()]).then(([sRes, rpRes]) => {
      setAllScores(sRes.data ?? [])
      setAllRoundPlayers(rpRes.data ?? [])
      setLoading(false)
    })
  }, [])

  const eligibleRounds = rounds.filter(r => r.format === 'stroke' || r.format === 'stableford' || !r.format)
  const matchRounds    = rounds.filter(r => r.format === 'match_1v1' || r.format === 'fourballs')

  const leaderboard    = buildTripLeaderboard(allScores, eligibleRounds, players, allRoundPlayers)
  const anyPlayed      = leaderboard.some(e => e.roundsPlayed > 0)

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-5 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Golf Scorer</div>
        <h1 className="text-3xl font-black text-white">Standings</h1>
        <div className="text-xs text-slate-600 mt-1.5">
          {eligibleRounds.length} stroke/stableford round{eligibleRounds.length !== 1 ? 's' : ''}
          {matchRounds.length > 0 && ` · ${matchRounds.length} match play round${matchRounds.length !== 1 ? 's' : ''} (excluded)`}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-600 text-sm">Loading…</div>
      ) : eligibleRounds.length === 0 ? (
        <div className="text-center py-16 text-slate-700">
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-bold text-sm">No stroke/stableford rounds yet</p>
          <p className="text-xs mt-1 text-slate-600">Standings aggregate stroke play and stableford rounds</p>
        </div>
      ) : !anyPlayed ? (
        <div className="text-center py-12 text-slate-600 text-sm">No scores entered yet</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const ranked = entry.roundsPlayed > 0
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
                    {entry.roundsPlayed} round{entry.roundsPlayed !== 1 ? 's' : ''} · HCP {entry.player.handicap}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {ranked ? (
                    <>
                      <div className="text-2xl font-black text-emerald-400 leading-none">{entry.totalNet}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        avg {entry.avgNet?.toFixed(1) ?? '—'} / round
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-slate-700">No scores</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-slate-700 text-center mt-5">
        Total net across stroke play & stableford rounds · lower wins
      </p>
    </div>
  )
}
