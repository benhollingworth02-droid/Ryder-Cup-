import { useReducer, useEffect } from 'react'
import { generateId, generateHoles, todayDate, calcMaxRyderPoints } from './utils/scoring'
import { RYDER_CUP_PRESET } from './data/presets'
import BottomNav from './components/BottomNav'
import Setup from './components/Setup'
import Scorecard from './components/Scorecard'
import Leaderboard from './components/Leaderboard'
import Matches from './components/Matches'
import Settings from './components/Settings'

const LS_ROUND = 'gst_round_v3'
const LS_HISTORY = 'gst_history_v3'

// ─── Initial state factories ──────────────────────────────────────────────────

export function makeBlankRound() {
  return {
    id: generateId(),
    roundName: '',
    courseName: '',
    date: todayDate(),
    format: 'strokePlay',
    numHoles: 18,
    holes: generateHoles(18),
    players: [],
    teams: [],
    scores: {},
    matches: [],
    ryderCupSettings: {
      scoringMethod: 'matchResult',
      pointsToWin: 5,
      totalPoints: 9,
    },
    roundStarted: false,
    createdAt: new Date().toISOString(),
  }
}

// ─── Round reducer ────────────────────────────────────────────────────────────

function roundReducer(round, action) {
  switch (action.type) {

    // Basic fields
    case 'UPDATE_FIELD':
      return { ...round, [action.field]: action.value }

    case 'SET_FORMAT':
      return { ...round, format: action.format }

    case 'SET_NUM_HOLES': {
      const numHoles = action.numHoles
      return { ...round, numHoles, holes: generateHoles(numHoles) }
    }

    // Holes
    case 'UPDATE_HOLE':
      return {
        ...round,
        holes: round.holes.map(h =>
          h.number === action.number ? { ...h, ...action.patch } : h
        ),
      }

    // Players
    case 'ADD_PLAYER': {
      const player = {
        id: generateId(),
        name: action.name || `Player ${round.players.length + 1}`,
        handicap: null,
        teamId: null,
      }
      return {
        ...round,
        players: [...round.players, player],
        scores: { ...round.scores, [player.id]: {} },
      }
    }

    case 'REMOVE_PLAYER': {
      const { [action.id]: _gone, ...restScores } = round.scores
      return {
        ...round,
        players: round.players.filter(p => p.id !== action.id),
        scores: restScores,
        teams: round.teams.map(t => ({
          ...t, playerIds: t.playerIds.filter(pid => pid !== action.id),
        })),
        matches: round.matches.map(m => ({
          ...m,
          teamAPlayerIds: m.teamAPlayerIds.filter(pid => pid !== action.id),
          teamBPlayerIds: m.teamBPlayerIds.filter(pid => pid !== action.id),
        })),
      }
    }

    case 'UPDATE_PLAYER':
      return {
        ...round,
        players: round.players.map(p =>
          p.id === action.id ? { ...p, ...action.patch } : p
        ),
      }

    case 'ASSIGN_PLAYER_TEAM':
      return {
        ...round,
        players: round.players.map(p =>
          p.id === action.playerId ? { ...p, teamId: action.teamId } : p
        ),
        teams: round.teams.map(t => {
          if (t.id === action.teamId) {
            return { ...t, playerIds: [...new Set([...t.playerIds, action.playerId])] }
          }
          return { ...t, playerIds: t.playerIds.filter(pid => pid !== action.playerId) }
        }),
      }

    // Teams
    case 'ADD_TEAM': {
      const colors = ['blue', 'red', 'green', 'amber', 'purple', 'orange']
      const team = {
        id: generateId(),
        name: action.name || `Team ${round.teams.length + 1}`,
        color: colors[round.teams.length % colors.length],
        playerIds: [],
      }
      return { ...round, teams: [...round.teams, team] }
    }

    case 'REMOVE_TEAM':
      return {
        ...round,
        teams: round.teams.filter(t => t.id !== action.id),
        players: round.players.map(p =>
          p.teamId === action.id ? { ...p, teamId: null } : p
        ),
      }

    case 'UPDATE_TEAM':
      return {
        ...round,
        teams: round.teams.map(t =>
          t.id === action.id ? { ...t, ...action.patch } : t
        ),
      }

    // Scores
    case 'SET_SCORE':
      return {
        ...round,
        scores: {
          ...round.scores,
          [action.playerId]: {
            ...(round.scores[action.playerId] || {}),
            [action.holeNumber]: action.score,
          },
        },
      }

    case 'CLEAR_HOLE_SCORE': {
      const pScores = { ...(round.scores[action.playerId] || {}) }
      delete pScores[action.holeNumber]
      return {
        ...round,
        scores: { ...round.scores, [action.playerId]: pScores },
      }
    }

    // Matches
    case 'ADD_MATCH': {
      const match = {
        id: generateId(),
        name: action.name || `Match ${round.matches.length + 1}`,
        type: action.matchType || 'singles',
        section: action.section || '',
        holeRange: action.holeRange || [1, round.numHoles],
        teamAPlayerIds: action.teamAPlayerIds || [],
        teamBPlayerIds: action.teamBPlayerIds || [],
        result: null,
      }
      return { ...round, matches: [...round.matches, match] }
    }

    case 'REMOVE_MATCH':
      return { ...round, matches: round.matches.filter(m => m.id !== action.id) }

    case 'UPDATE_MATCH':
      return {
        ...round,
        matches: round.matches.map(m =>
          m.id === action.id ? { ...m, ...action.patch } : m
        ),
      }

    case 'SET_MATCH_RESULT':
      return {
        ...round,
        matches: round.matches.map(m =>
          m.id === action.id ? { ...m, result: action.result } : m
        ),
      }

    // Ryder Cup settings
    case 'UPDATE_RYDER_SETTINGS':
      return {
        ...round,
        ryderCupSettings: { ...round.ryderCupSettings, ...action.patch },
      }

    // Round lifecycle
    case 'START_ROUND':
      return { ...round, roundStarted: true }

    case 'RESET_SCORES':
      return {
        ...round,
        scores: Object.fromEntries(round.players.map(p => [p.id, {}])),
        matches: round.matches.map(m => ({ ...m, result: null })),
      }

    case 'RESET_PLAYERS':
      return {
        ...round,
        players: [],
        scores: {},
        teams: round.teams.map(t => ({ ...t, playerIds: [] })),
        matches: round.matches.map(m => ({ ...m, teamAPlayerIds: [], teamBPlayerIds: [], result: null })),
      }

    case 'RESET_TEAMS':
      return {
        ...round,
        teams: [],
        players: round.players.map(p => ({ ...p, teamId: null })),
        matches: [],
      }

    case 'RESET_HOLES':
      return { ...round, holes: generateHoles(round.numHoles) }

    case 'RESET_MATCHES':
      return { ...round, matches: [], scores: Object.fromEntries(round.players.map(p => [p.id, {}])) }

    case 'LOAD_PRESET':
      return {
        ...action.preset,
        id: generateId(),
        createdAt: new Date().toISOString(),
        roundStarted: false,
      }

    case 'LOAD_ROUND':
      return { ...action.round }

    case 'RESET_FULL':
      return makeBlankRound()

    default:
      return round
  }
}

// ─── UI state reducer ─────────────────────────────────────────────────────────

function uiReducer(state, action) {
  switch (action.type) {
    case 'SET_TAB': return { ...state, activeTab: action.tab }
    case 'SET_HOLE': return { ...state, activeHole: action.hole }
    case 'SET_CONFIRM': return { ...state, confirm: action.confirm }
    case 'SET_SAVED': return { ...state, savedRounds: action.rounds }
    default: return state
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [round, dispatch] = useReducer(roundReducer, null, () => {
    try {
      const saved = localStorage.getItem(LS_ROUND)
      return saved ? JSON.parse(saved) : makeBlankRound()
    } catch { return makeBlankRound() }
  })

  const [ui, uiDispatch] = useReducer(uiReducer, null, () => {
    let savedRounds = []
    try {
      const h = localStorage.getItem(LS_HISTORY)
      savedRounds = h ? JSON.parse(h) : []
    } catch { /* ignore */ }

    let initialRound
    try {
      const saved = localStorage.getItem(LS_ROUND)
      initialRound = saved ? JSON.parse(saved) : null
    } catch { /* ignore */ }

    const defaultTab = initialRound?.roundStarted
      ? (initialRound.format === 'ryderCup' ? 'matches' : 'scorecard')
      : 'setup'

    return { activeTab: defaultTab, activeHole: 1, confirm: null, savedRounds }
  })

  // Persist round
  useEffect(() => {
    if (round) localStorage.setItem(LS_ROUND, JSON.stringify(round))
  }, [round])

  // Persist history
  useEffect(() => {
    localStorage.setItem(LS_HISTORY, JSON.stringify(ui.savedRounds))
  }, [ui.savedRounds])

  function setTab(tab) { uiDispatch({ type: 'SET_TAB', tab }) }
  function setHole(hole) { uiDispatch({ type: 'SET_HOLE', hole }) }

  function confirm(message, onConfirm) {
    uiDispatch({ type: 'SET_CONFIRM', confirm: { message, onConfirm } })
  }

  function saveCurrentRound() {
    const entry = {
      id: round.id,
      roundName: round.roundName || 'Untitled Round',
      courseName: round.courseName || '',
      date: round.date,
      format: round.format,
      savedAt: new Date().toISOString(),
      round,
    }
    uiDispatch({
      type: 'SET_SAVED',
      rounds: [entry, ...ui.savedRounds.filter(r => r.id !== round.id)].slice(0, 30),
    })
  }

  function loadSavedRound(entry) {
    dispatch({ type: 'LOAD_ROUND', round: entry.round })
    setTab(entry.round.format === 'ryderCup' ? 'matches' : 'scorecard')
  }

  function deleteSavedRound(id) {
    uiDispatch({ type: 'SET_SAVED', rounds: ui.savedRounds.filter(r => r.id !== id) })
  }

  function startNewRound() {
    dispatch({ type: 'RESET_FULL' })
    setTab('setup')
  }

  function handleStartRound() {
    dispatch({ type: 'START_ROUND' })
    setTab(round.format === 'ryderCup' ? 'matches'
      : round.format === 'matchPlay' ? 'matches' : 'scorecard')
  }

  function loadPreset(preset) {
    dispatch({ type: 'LOAD_PRESET', preset })
    setTab('setup')
  }

  // Tabs shown based on format + round state
  const showScorecard = round?.roundStarted && ['strokePlay', 'stableford', 'matchPlay', 'ryderCup'].includes(round.format)
  const showLeaderboard = round?.roundStarted
  const showMatches = round?.roundStarted && ['matchPlay', 'ryderCup'].includes(round.format)

  const tabs = [
    { id: 'setup',       label: 'Setup',      icon: '⚙️' },
    ...(showScorecard  ? [{ id: 'scorecard',  label: 'Scorecard', icon: '📋' }] : []),
    ...(showLeaderboard ? [{ id: 'leaderboard', label: 'Scores', icon: '🏆' }] : []),
    ...(showMatches    ? [{ id: 'matches',    label: 'Matches',   icon: '⚔️' }] : []),
    { id: 'settings',    label: 'Settings',   icon: '🔧' },
  ]

  const shared = {
    round, dispatch,
    ui, uiDispatch,
    setTab, setHole, confirm,
    saveCurrentRound, loadSavedRound, deleteSavedRound,
    startNewRound, loadPreset,
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-lg mx-auto">
      <div className="flex-1 overflow-auto pb-20">
        {ui.activeTab === 'setup' && (
          <Setup {...shared} onStart={handleStartRound} />
        )}
        {ui.activeTab === 'scorecard' && round?.roundStarted && (
          <Scorecard {...shared} />
        )}
        {ui.activeTab === 'leaderboard' && round?.roundStarted && (
          <Leaderboard {...shared} />
        )}
        {ui.activeTab === 'matches' && round?.roundStarted && (
          <Matches {...shared} />
        )}
        {ui.activeTab === 'settings' && (
          <Settings {...shared} />
        )}
      </div>

      <BottomNav tabs={tabs} activeTab={ui.activeTab} onTabChange={setTab} />

      {ui.confirm && (
        <ConfirmModal
          message={ui.confirm.message}
          onConfirm={() => { ui.confirm.onConfirm(); uiDispatch({ type: 'SET_CONFIRM', confirm: null }) }}
          onCancel={() => uiDispatch({ type: 'SET_CONFIRM', confirm: null })}
        />
      )}
    </div>
  )
}

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-xs border border-gray-700 shadow-2xl">
        <p className="text-white text-center font-semibold mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-gray-800 text-gray-300 font-bold border border-gray-700 active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-black active:scale-95">
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
