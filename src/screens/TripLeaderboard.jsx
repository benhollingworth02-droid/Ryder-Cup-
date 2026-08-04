import { useState, useEffect } from 'react'
import { fetchAllScores } from '../lib/supabase'
import { buildTripLeaderboard } from '../utils/scoring'

const MEDAL = ['🥇', '🥈', '🥉']

export default function TripLeaderboard({ players, rounds }) {
  const [allScores, setAllScores] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchAllScores().then(({ data }) => {
      setAllScores(data ?? [])
      setLoading(false)
    })
  }, [])

  const leaderboard = buildTripLeaderboard(allScores, rounds, players)
  const anyRoundsPlayed = leaderboard.some(e => e.roundsPlayed > 0)

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-5 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Golf Trip</div>
        <h1 className="text-3xl font-black text-white">Standings</h1>
        <div className="text-xs text-gray-600 mt-1.5">
          {rounds.length} round{rounds.length !== 1 ? 's' : ''} · Total net score (lower wins)
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-600 text-sm">Loading…</div>
      ) : rounds.length === 0 ? (
        <div className="text-center py-16 text-gray-700">
          <div className="text-4xl mb-3">🏆</div>
          <p className="font-bold text-sm">No rounds played yet</p>
        </div>
      ) : !anyRoundsPlayed ? (
        <div className="text-center py-12 text-gray-600 text-sm">No scores entered yet</div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry, i) => {
            const ranked = entry.roundsPlayed > 0
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
                    {entry.roundsPlayed} round{entry.roundsPlayed !== 1 ? 's' : ''} · HCP {entry.player.handicap}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {ranked ? (
                    <>
                      <div className="text-2xl font-black text-green-400 leading-none">{entry.totalNet}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        avg {entry.avgNet?.toFixed(1) ?? '—'} / round
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-700">No scores</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-gray-700 text-center mt-5">
        Gross total − handicap per round · tallied across all rounds played
      </p>
    </div>
  )
}
