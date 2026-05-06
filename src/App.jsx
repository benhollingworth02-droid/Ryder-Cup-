import { useReducer, useEffect, useState } from 'react'
import { calcTotalPoints } from './utils/scoring'
import BottomNav from './components/BottomNav'
import Scoreboard from './components/Scoreboard'
import Matches from './components/Matches'
import Setup from './components/Setup'
import Settings from './components/Settings'

const LS_KEY = 'bromsgrove-cup-v1'
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
  holes: Array.from({ length: 18 }, (_, i) => ({ number: i + 1, par: 4, strokeIndex: i + 1 })),
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

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch {}
  }, [state])

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
          <Settings dispatch={dispatch} confirm={showConfirm} />
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} ptsA={ptsA} ptsB={ptsB} />

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
