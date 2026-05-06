import { useReducer, useEffect, useState, useRef } from 'react'
import { calcTotalPoints } from './utils/scoring'
import { hasSupabase, saveRoundRemote, loadRoundRemote, subscribeToRound, unsubscribeFromRound } from './lib/supabase'
import BottomNav from './components/BottomNav'
import Scoreboard from './components/Scoreboard'
import Matches from './components/Matches'
import Setup from './components/Setup'
import Settings from './components/Settings'

const LS_KEY = 'bromsgrove-cup-v1'
const ROUND_ID = 'BROMSGROVE2025'
export const POINTS_TO_WIN = 41
export const TOTAL_POINTS = 81

const DEFAULT_PLAYERS = [
  { id: 'h1', name: 'Nick Jacobsen', teamId: 'team-h' },
  { id: 'h2', name: 'Pearce Childs', teamId: 'team-h' },
  { id: 'h3', name: 'Joe Colebrook', teamId: 'team-h' },
  { id: 'h4', name: 'Ben Hollingworth', teamId: 'team-h' },
  { id: 'h5', name: 'Fin Morgan', teamId: 'team-h' },
  { id: 'h6', name: 'Seb Mehjoo', teamId: 'team-h' },
  { id: 'w1', name: 'Alex Griffiths', teamId: 'team-w' },
  { id: 'w2', name: 'Will Upton', teamId: 'team-w' },
  { id: 'w3', name: 'Max Campbell', teamId: 'team-w' },
  { id: 'w4', name: 'Euan Vaugh-Hawkins', teamId: 'team-w' },
  { id: 'w5', name: 'Ed Wagstaff', teamId: 'team-w' },
  { id: 'w6', name: 'Tom Reynolds', teamId: 'team-w' },
]

const DEFAULT_MATCHES = [
  { id: 'm1', name: 'Fourball 1', type: 'fourballs', section: 'front9', holeRange: [1, 9], teamAPlayerIds: ['h1', 'h6'], teamBPlayerIds: ['w1', 'w6'] },
  { id: 'm2', name: 'Fourball 2', type: 'fourballs', section: 'front9', holeRange: [1, 9], teamAPlayerIds: ['h2', 'h5'], teamBPlayerIds: ['w2', 'w5'] },
  { id: 'm3', name: 'Fourball 3', type: 'fourballs', section: 'front9', holeRange: [1, 9], teamAPlayerIds: ['h3', 'h4'], teamBPlayerIds: ['w3', 'w4'] },
  { id: 'm4', name: 'Singles 1', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h1'], teamBPlayerIds: ['w1'] },
  { id: 'm5', name: 'Singles 2', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h2'], teamBPlayerIds: ['w2'] },
  { id: 'm6', name: 'Singles 3', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h3'], teamBPlayerIds: ['w3'] },
  { id: 'm7', name: 'Singles 4', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h4'], teamBPlayerIds: ['w4'] },
  { id: 'm8', name: 'Singles 5', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h5'], teamBPlayerIds: ['w5'] },
  { id: 'm9', name: 'Singles 6', type: 'singles', section: 'back9', holeRange: [10, 18], teamAPlayerIds: ['h6'], teamBPlayerIds: ['w6'] },
]

const DEFAULT_SCORES = { h1: {}, h2: {}, h3: {}, h4: {}, h5: {}, h6: {}, w1: {}, w2: {}, w3: {}, w4: {}, w5: {}, w6: {} }

export const DEFAULT_STATE = {
  teams: [
    { id: 'team-h', name: 'Team Hollingworth' },
    { id: 'team-w', name: 'Team Wagstaff' },
  ],
  players: DEFAULT_PLAYERS,
  holes: [
    { number:  1, par: 4, strokeIndex:  1 },
    { number:  2, par: 4, strokeIndex:  2 },
    { number:  3, par: 3, strokeIndex:  3 },
    { number:  4, par: 4, strokeIndex:  4 },
    { number:  5, par: 4, strokeIndex:  5 },
    { number:  6, par: 4, strokeIndex:  6 },
    { number:  7, par: 3, strokeIndex:  7 },
    { number:  8, par: 4, strokeIndex:  8 },
    { number:  9, par: 4, strokeIndex:  9 },
    { number: 10, par: 4, strokeIndex: 10 },
    { number: 11, par: 3, strokeIndex: 11 },
    { number: 12, par: 4, strokeIndex: 12 },
    { number: 13, par: 4, strokeIndex: 13 },
    { number: 14, par: 4, strokeIndex: 14 },
    { number: 15, par: 4, strokeIndex: 15 },
    { number: 16, par: 3, strokeIndex: 16 },
    { number: 17, par: 3, strokeIndex: 17 },
    { number: 18, par: 5, strokeIndex: 18 },
  ],
  matches: DEFAULT_MATCHES,
  scores: DEFAULT_SCORES,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCORE': {
      const { playerId, holeNumber, gross } = action
      return {
        ...state,
        scores: {
          ...state.scores,
          [playerId]: {
            ...state.scores[playerId],
            [holeNumber]: { gross },
          },
        },
      }
    }
    case 'CLEAR_SCORE': {
      const { playerId, holeNumber } = action
      const playerScores = { ...state.scores[playerId] }
      delete playerScores[holeNumber]
      return {
        ...state,
        scores: { ...state.scores, [playerId]: playerScores },
      }
    }
    case 'UPDATE_PLAYER_NAME': {
      return {
        ...state,
        players: state.players.map(p =>
          p.id === action.playerId ? { ...p, name: action.name } : p
        ),
      }
    }
    case 'UPDATE_TEAM_NAME': {
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === action.teamId ? { ...t, name: action.name } : t
        ),
      }
    }
    case 'UPDATE_HOLE_PAR': {
      return {
        ...state,
        holes: state.holes.map(h =>
          h.number === action.holeNumber ? { ...h, par: action.par } : h
        ),
      }
    }
    case 'RESET_SCORES': {
      return { ...state, scores: DEFAULT_SCORES }
    }
    case 'RESET_NAMES': {
      return {
        ...state,
        teams: DEFAULT_STATE.teams,
        players: DEFAULT_PLAYERS,
      }
    }
    case 'RESET_ALL': {
      return DEFAULT_STATE
    }
    case 'LOAD_STATE': {
      // Merge incoming remote state over defaults; strips any extra fields (e.g. id)
      const { id: _id, ...clean } = action.state
      return { ...DEFAULT_STATE, ...clean }
    }
    default:
      return state
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_STATE
    const saved = JSON.parse(raw)
    return {
      ...DEFAULT_STATE,
      ...saved,
      scores: saved.scores ?? DEFAULT_SCORES,
    }
  } catch {
    return DEFAULT_STATE
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const [tab, setTab] = useState('scoreboard')
  const [confirm, setConfirm] = useState(null)
  const [syncStatus, setSyncStatus] = useState(hasSupabase ? 'syncing' : 'local')

  // skipSaveRef: set to true before applying a remote update so the
  // persistence effect doesn't echo it straight back to Supabase.
  const skipSaveRef = useRef(false)
  const debounceRef = useRef(null)

  // Persist to localStorage on every change; also debounce-save to Supabase.
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}

    if (!hasSupabase) return

    if (skipSaveRef.current) {
      skipSaveRef.current = false
      clearTimeout(debounceRef.current)
      return
    }

    setSyncStatus('syncing')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { error } = await saveRoundRemote({ ...state, id: ROUND_ID }, 'no-pin')
      setSyncStatus(error ? 'error' : 'live')
    }, 750)
  }, [state])

  // On mount: load remote state if available, then subscribe to live updates.
  useEffect(() => {
    if (!hasSupabase) return
    let channel = null

    ;(async () => {
      const { data } = await loadRoundRemote(ROUND_ID)
      if (data?.round) {
        skipSaveRef.current = true
        dispatch({ type: 'LOAD_STATE', state: data.round })
      }
      setSyncStatus('live')

      channel = subscribeToRound(ROUND_ID, (incoming) => {
        clearTimeout(debounceRef.current)
        skipSaveRef.current = true
        dispatch({ type: 'LOAD_STATE', state: incoming })
        setSyncStatus('live')
      })
    })()

    return () => {
      unsubscribeFromRound(channel)
      clearTimeout(debounceRef.current)
    }
  }, [])

  function showConfirm(msg, onOk) {
    setConfirm({ msg, onOk })
  }

  const teamA = state.teams[0]
  const teamB = state.teams[1]
  const { a: ptsA, b: ptsB } = calcTotalPoints(state.matches, state.holes, state.scores)

  return (
    <div className="max-w-md mx-auto relative">
      <div className="pb-16">
        {tab === 'scoreboard' && (
          <Scoreboard
            state={state}
            ptsA={ptsA}
            ptsB={ptsB}
            teamA={teamA}
            teamB={teamB}
            onNavigateMatches={() => setTab('matches')}
          />
        )}
        {tab === 'matches' && (
          <Matches
            state={state}
            dispatch={dispatch}
            teamA={teamA}
            teamB={teamB}
          />
        )}
        {tab === 'setup' && (
          <Setup state={state} dispatch={dispatch} />
        )}
        {tab === 'settings' && (
          <Settings dispatch={dispatch} confirm={showConfirm} syncStatus={syncStatus} />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} ptsA={ptsA} ptsB={ptsB} />

      {/* Non-intrusive sync status pill — only renders when Supabase is configured */}
      {hasSupabase && (
        <div className="fixed top-2 right-2 z-50 text-[10px] font-bold px-2 py-1 rounded-full bg-gray-900/90 border border-gray-800 backdrop-blur-sm pointer-events-none">
          {syncStatus === 'live'    && <span className="text-green-400">● Live</span>}
          {syncStatus === 'syncing' && <span className="text-yellow-400">● Syncing</span>}
          {syncStatus === 'error'   && <span className="text-red-400">● Sync error</span>}
          {syncStatus === 'local'   && <span className="text-gray-500">● Local</span>}
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-sm">
            <p className="text-white text-center mb-6 text-sm leading-relaxed">{confirm.msg}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl bg-gray-800 text-gray-300 font-bold text-sm border border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => { confirm.onOk(); setConfirm(null) }}
                className="flex-1 py-3 rounded-xl bg-red-700 text-white font-bold text-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
