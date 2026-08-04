import { useState, useEffect, useRef } from 'react'
import {
  hasSupabase,
  fetchPlayers, fetchRounds, fetchScores,
  subscribePlayers, subscribeRounds, subscribeScores, unsubscribe,
  upsertScore, deleteScore,
} from './lib/supabase'
import Home             from './screens/Home'
import Players          from './screens/Players'
import NewRound         from './screens/NewRound'
import Scoring          from './screens/Scoring'
import RoundLeaderboard from './screens/RoundLeaderboard'
import TripLeaderboard  from './screens/TripLeaderboard'
import BottomNav        from './components/BottomNav'

export default function App() {
  // ── Navigation (LOCAL ONLY — never synced; each device is independent) ──────
  const [screen, setScreen]           = useState('home')
  const [activeRound, setActiveRound] = useState(null)

  // ── Shared data (from Supabase, synced live) ──────────────────────────────
  const [players, setPlayers] = useState([])
  const [rounds, setRounds]   = useState([])
  const [scores, setScores]   = useState([])   // scores for activeRound only
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const scoreChannelRef = useRef(null)

  // Load players + rounds on mount; subscribe to live changes
  useEffect(() => {
    if (!hasSupabase) {
      setError('Supabase not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel')
      setLoading(false)
      return
    }

    Promise.all([fetchPlayers(), fetchRounds()])
      .then(([pRes, rRes]) => {
        if (pRes.error) throw new Error(pRes.error?.message ?? String(pRes.error))
        if (rRes.error) throw new Error(rRes.error?.message ?? String(rRes.error))
        setPlayers(pRes.data ?? [])
        setRounds(rRes.data ?? [])
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })

    const ch1 = subscribePlayers(payload => {
      if (payload.eventType === 'INSERT')
        setPlayers(prev => [...prev, payload.new])
      else if (payload.eventType === 'UPDATE')
        setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
      else if (payload.eventType === 'DELETE')
        setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
    })

    const ch2 = subscribeRounds(payload => {
      if (payload.eventType === 'INSERT')
        setRounds(prev => prev.some(r => r.id === payload.new.id) ? prev : [payload.new, ...prev])
      else if (payload.eventType === 'UPDATE')
        setRounds(prev => prev.map(r => r.id === payload.new.id ? payload.new : r))
      else if (payload.eventType === 'DELETE')
        setRounds(prev => prev.filter(r => r.id !== payload.old.id))
    })

    return () => { unsubscribe(ch1); unsubscribe(ch2) }
  }, [])

  // Load + subscribe scores when activeRound changes
  useEffect(() => {
    if (scoreChannelRef.current) {
      unsubscribe(scoreChannelRef.current)
      scoreChannelRef.current = null
    }
    if (!activeRound || !hasSupabase) { setScores([]); return }

    fetchScores(activeRound.id).then(({ data }) => setScores(data ?? []))

    scoreChannelRef.current = subscribeScores(activeRound.id, payload => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const s = payload.new
        setScores(prev => {
          const idx = prev.findIndex(x => x.player_id === s.player_id && x.hole_number === s.hole_number)
          return idx >= 0 ? prev.map((x, i) => i === idx ? s : x) : [...prev, s]
        })
      } else if (payload.eventType === 'DELETE') {
        const s = payload.old
        setScores(prev => prev.filter(x => !(x.player_id === s.player_id && x.hole_number === s.hole_number)))
      }
    })

    return () => {
      if (scoreChannelRef.current) { unsubscribe(scoreChannelRef.current); scoreChannelRef.current = null }
    }
  }, [activeRound?.id])

  // ── Score mutations with optimistic updates ────────────────────────────────
  async function handleScoreChange(playerId, holeNumber, strokes) {
    // Optimistic: update local state immediately for instant UI feedback
    setScores(prev => {
      const idx = prev.findIndex(s => s.player_id === playerId && s.hole_number === holeNumber)
      const entry = {
        id: idx >= 0 ? prev[idx].id : `opt-${playerId}-${holeNumber}`,
        round_id: activeRound.id, player_id: playerId, hole_number: holeNumber, strokes,
      }
      return idx >= 0 ? prev.map((s, i) => i === idx ? entry : s) : [...prev, entry]
    })
    // Persist — Realtime will come back and replace the optimistic entry with the real DB row
    await upsertScore(activeRound.id, playerId, holeNumber, strokes)
  }

  async function handleScoreClear(playerId, holeNumber) {
    setScores(prev => prev.filter(s => !(s.player_id === playerId && s.hole_number === holeNumber)))
    await deleteScore(activeRound.id, playerId, holeNumber)
  }

  // ── Navigation helpers ────────────────────────────────────────────────────
  function openScoring(round)     { setActiveRound(round); setScreen('scoring') }
  function openLeaderboard(round) { setActiveRound(round); setScreen('round-leaderboard') }
  function goHome()               { setScreen('home') }

  // ── Loading / error states ─────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center text-gray-600">
        <div className="text-4xl mb-3">⛳</div>
        <div className="text-sm">Loading…</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="text-3xl mb-3">⚠️</div>
        <div className="text-red-400 font-bold text-sm mb-2">Connection Error</div>
        <div className="text-gray-500 text-xs leading-relaxed">{error}</div>
      </div>
    </div>
  )

  // Scoring, round leaderboard, and new round are full-screen (no bottom nav)
  const isFullScreen = screen === 'scoring' || screen === 'round-leaderboard' || screen === 'new-round'

  return (
    <div className="max-w-md mx-auto">
      {screen === 'home' && (
        <div className="pb-16">
          <Home
            rounds={rounds}
            players={players}
            onNewRound={() => setScreen('new-round')}
            onScoring={openScoring}
            onLeaderboard={openLeaderboard}
          />
        </div>
      )}

      {screen === 'players' && (
        <div className="pb-16">
          <Players players={players} />
        </div>
      )}

      {screen === 'trip-leaderboard' && (
        <div className="pb-16">
          <TripLeaderboard players={players} rounds={rounds} />
        </div>
      )}

      {screen === 'new-round' && (
        <NewRound
          onCreated={round => {
            setRounds(prev => [round, ...prev])
            openScoring(round)
          }}
          onBack={goHome}
        />
      )}

      {screen === 'scoring' && (
        <Scoring
          round={activeRound}
          players={players}
          scores={scores}
          onBack={goHome}
          onLeaderboard={() => openLeaderboard(activeRound)}
          onScoreChange={handleScoreChange}
          onScoreClear={handleScoreClear}
        />
      )}

      {screen === 'round-leaderboard' && (
        <RoundLeaderboard
          round={activeRound}
          players={players}
          scores={scores}
          onBack={goHome}
          onScoring={() => openScoring(activeRound)}
        />
      )}

      {!isFullScreen && (
        <BottomNav
          screen={screen}
          onHome={goHome}
          onPlayers={() => setScreen('players')}
          onLeaderboard={() => setScreen('trip-leaderboard')}
        />
      )}
    </div>
  )
}
