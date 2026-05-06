import { useState } from 'react'
import { RYDER_CUP_PRESET } from '../data/presets'

const FORMAT_OPTIONS = [
  { value: 'strokePlay',  label: 'Stroke Play',  desc: 'Lowest total score wins' },
  { value: 'stableford', label: 'Stableford',    desc: 'Points from score vs par' },
  { value: 'matchPlay',  label: 'Match Play',    desc: 'Hole-by-hole wins' },
  { value: 'ryderCup',   label: 'Ryder Cup',     desc: 'Team match play format' },
]

const TEAM_COLORS = [
  { value: 'blue',   label: 'Blue',   cls: 'bg-blue-600' },
  { value: 'red',    label: 'Red',    cls: 'bg-red-600' },
  { value: 'green',  label: 'Green',  cls: 'bg-green-600' },
  { value: 'amber',  label: 'Amber',  cls: 'bg-amber-500' },
  { value: 'purple', label: 'Purple', cls: 'bg-purple-600' },
]

const TEAM_COLOR_MAP = {
  blue: 'bg-blue-600 text-white', red: 'bg-red-600 text-white',
  green: 'bg-green-600 text-white', amber: 'bg-amber-500 text-white',
  purple: 'bg-purple-600 text-white', orange: 'bg-orange-500 text-white',
}

const MATCH_TYPES = [
  { value: 'singles',   label: 'Singles',   desc: '1 v 1' },
  { value: 'fourballs', label: 'Fourballs', desc: 'Best ball 2 v 2' },
  { value: 'foursomes', label: 'Foursomes', desc: 'Alternate shot 2 v 2' },
]

// ─── Shared small components ──────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-gray-800" />
      <h2 className="text-[10px] font-black uppercase tracking-widest text-green-400 whitespace-nowrap">
        {children}
      </h2>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      {label && <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">{label}</label>}
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600 placeholder-gray-600"
      />
    </div>
  )
}

function Btn({ children, onClick, variant = 'secondary', size = 'md', className = '' }) {
  const base = 'font-bold rounded-xl active:scale-95 transition-all'
  const sizes = { sm: 'px-3 py-2 text-xs', md: 'px-4 py-3 text-sm', lg: 'px-5 py-4 text-base' }
  const variants = {
    primary:   'bg-green-600 text-white hover:bg-green-500',
    secondary: 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700',
    danger:    'bg-red-900/60 text-red-300 border border-red-800 hover:bg-red-900',
    blue:      'bg-blue-600 text-white hover:bg-blue-500',
    ghost:     'text-gray-400 hover:text-white',
  }
  return (
    <button onClick={onClick} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

// ─── Section: Round Info ──────────────────────────────────────────────────────

function RoundInfoSection({ round, dispatch }) {
  return (
    <div className="space-y-3">
      <Input
        label="Round Name"
        value={round.roundName}
        onChange={v => dispatch({ type: 'UPDATE_FIELD', field: 'roundName', value: v })}
        placeholder="e.g. Sunday Medal"
      />
      <Input
        label="Course"
        value={round.courseName}
        onChange={v => dispatch({ type: 'UPDATE_FIELD', field: 'courseName', value: v })}
        placeholder="e.g. St Andrews"
      />
      <Input
        label="Date"
        type="date"
        value={round.date}
        onChange={v => dispatch({ type: 'UPDATE_FIELD', field: 'date', value: v })}
      />
    </div>
  )
}

// ─── Section: Format ──────────────────────────────────────────────────────────

function FormatSection({ round, dispatch }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {FORMAT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => dispatch({ type: 'SET_FORMAT', format: opt.value })}
          className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
            round.format === opt.value
              ? 'border-green-500 bg-green-900/30 text-white'
              : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="font-bold text-sm">{opt.label}</div>
          <div className="text-xs mt-0.5 opacity-70">{opt.desc}</div>
        </button>
      ))}
    </div>
  )
}

// ─── Section: Holes ───────────────────────────────────────────────────────────

function HolesSection({ round, dispatch }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {[9, 18].map(n => (
          <button
            key={n}
            onClick={() => dispatch({ type: 'SET_NUM_HOLES', numHoles: n })}
            className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all active:scale-95 ${
              round.numHoles === n
                ? 'border-green-500 bg-green-900/30 text-white'
                : 'border-gray-700 bg-gray-800/50 text-gray-400'
            }`}
          >
            {n} Holes
          </button>
        ))}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-green-400 font-semibold w-full text-center py-1"
      >
        {expanded ? '▲ Hide hole details' : '▼ Edit hole pars / stroke index'}
      </button>

      {expanded && (
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800/60">
                <th className="p-2 text-gray-400 font-bold text-left w-10">Hole</th>
                <th className="p-2 text-gray-400 font-bold">Par</th>
                <th className="p-2 text-gray-400 font-bold">SI</th>
                <th className="p-2 text-gray-400 font-bold">Yards</th>
              </tr>
            </thead>
            <tbody>
              {round.holes.map(hole => (
                <tr key={hole.number} className="border-t border-gray-800">
                  <td className="p-2 text-gray-400 font-bold">{hole.number}</td>
                  <td className="p-1">
                    <select
                      value={hole.par}
                      onChange={e => dispatch({ type: 'UPDATE_HOLE', number: hole.number, patch: { par: Number(e.target.value) } })}
                      className="bg-gray-800 text-white rounded-lg p-1.5 w-full border border-gray-700 text-xs"
                    >
                      {[3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      min="1"
                      max={round.numHoles}
                      value={hole.strokeIndex ?? ''}
                      onChange={e => dispatch({ type: 'UPDATE_HOLE', number: hole.number, patch: { strokeIndex: e.target.value ? Number(e.target.value) : null } })}
                      className="bg-gray-800 text-white rounded-lg p-1.5 w-full border border-gray-700 text-xs text-center"
                      placeholder="—"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="number"
                      min="1"
                      value={hole.yardage ?? ''}
                      onChange={e => dispatch({ type: 'UPDATE_HOLE', number: hole.number, patch: { yardage: e.target.value ? Number(e.target.value) : null } })}
                      className="bg-gray-800 text-white rounded-lg p-1.5 w-full border border-gray-700 text-xs text-center"
                      placeholder="—"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Section: Players ─────────────────────────────────────────────────────────

function PlayersSection({ round, dispatch }) {
  const [editingId, setEditingId] = useState(null)
  const teamMap = Object.fromEntries(round.teams.map(t => [t.id, t]))

  return (
    <div>
      <div className="space-y-2 mb-3">
        {round.players.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-3">No players yet. Add some below.</p>
        )}
        {round.players.map(player => (
          <div key={player.id} className="bg-gray-800/60 rounded-xl border border-gray-700 p-3">
            {editingId === player.id ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    autoFocus
                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-green-600"
                    value={player.name}
                    onChange={e => dispatch({ type: 'UPDATE_PLAYER', id: player.id, patch: { name: e.target.value } })}
                    placeholder="Player name"
                  />
                  <button onClick={() => setEditingId(null)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold active:scale-95">
                    ✓
                  </button>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs text-gray-500 shrink-0">Handicap:</label>
                  <input
                    type="number"
                    min="0"
                    max="54"
                    value={player.handicap ?? ''}
                    onChange={e => dispatch({ type: 'UPDATE_PLAYER', id: player.id, patch: { handicap: e.target.value ? Number(e.target.value) : null } })}
                    className="w-20 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none"
                    placeholder="—"
                  />
                </div>
                {round.teams.length > 0 && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Team:</label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => dispatch({ type: 'ASSIGN_PLAYER_TEAM', playerId: player.id, teamId: null })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${!player.teamId ? 'border-green-500 bg-green-900/30 text-white' : 'border-gray-700 text-gray-400'}`}
                      >
                        None
                      </button>
                      {round.teams.map(t => (
                        <button
                          key={t.id}
                          onClick={() => dispatch({ type: 'ASSIGN_PLAYER_TEAM', playerId: player.id, teamId: t.id })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                            player.teamId === t.id ? TEAM_COLOR_MAP[t.color] : 'bg-gray-700 text-gray-400 border border-gray-600'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-white">{player.name}</span>
                  {player.handicap != null && (
                    <span className="text-xs text-gray-500 ml-2">HCP {player.handicap}</span>
                  )}
                  {player.teamId && teamMap[player.teamId] && (
                    <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${TEAM_COLOR_MAP[teamMap[player.teamId].color]}`}>
                      {teamMap[player.teamId].name}
                    </span>
                  )}
                </div>
                <button onClick={() => setEditingId(player.id)}
                  className="text-gray-500 hover:text-white px-2 py-1 text-sm">✏️</button>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_PLAYER', id: player.id })}
                  className="text-gray-600 hover:text-red-400 px-2 py-1 text-sm">✕</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Btn onClick={() => dispatch({ type: 'ADD_PLAYER' })} variant="secondary" className="w-full">
        + Add Player
      </Btn>
    </div>
  )
}

// ─── Section: Teams ───────────────────────────────────────────────────────────

function TeamsSection({ round, dispatch }) {
  const [editingId, setEditingId] = useState(null)

  return (
    <div>
      <div className="space-y-2 mb-3">
        {round.teams.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-3">No teams yet. Add teams below.</p>
        )}
        {round.teams.map(team => {
          const members = round.players.filter(p => p.teamId === team.id)
          return (
            <div key={team.id} className="bg-gray-800/60 rounded-xl border border-gray-700 p-3">
              {editingId === team.id ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-green-600"
                      value={team.name}
                      onChange={e => dispatch({ type: 'UPDATE_TEAM', id: team.id, patch: { name: e.target.value } })}
                    />
                    <button onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold active:scale-95">✓</button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {TEAM_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => dispatch({ type: 'UPDATE_TEAM', id: team.id, patch: { color: c.value } })}
                        className={`w-7 h-7 rounded-full ${c.cls} ${team.color === c.value ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-800' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${TEAM_COLOR_MAP[team.color]?.split(' ')[0]}`} />
                  <div className="flex-1">
                    <span className="font-semibold text-white">{team.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{members.length} player{members.length !== 1 ? 's' : ''}</span>
                  </div>
                  <button onClick={() => setEditingId(team.id)}
                    className="text-gray-500 hover:text-white px-2 py-1 text-sm">✏️</button>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_TEAM', id: team.id })}
                    className="text-gray-600 hover:text-red-400 px-2 py-1 text-sm">✕</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Btn onClick={() => dispatch({ type: 'ADD_TEAM' })} variant="secondary" className="w-full">
        + Add Team
      </Btn>
    </div>
  )
}

// ─── Section: Matches ─────────────────────────────────────────────────────────

function MatchesSection({ round, dispatch }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newMatch, setNewMatch] = useState({ name: '', type: 'singles', section: '', holeStart: 1, holeEnd: round.numHoles })
  const [aIds, setAIds] = useState([])
  const [bIds, setBIds] = useState([])
  const [editingId, setEditingId] = useState(null)

  const teamA = round.teams[0]
  const teamB = round.teams[1]

  function addMatch() {
    dispatch({
      type: 'ADD_MATCH',
      name: newMatch.name || `Match ${round.matches.length + 1}`,
      matchType: newMatch.type,
      section: newMatch.section,
      holeRange: [Number(newMatch.holeStart), Number(newMatch.holeEnd)],
      teamAPlayerIds: aIds,
      teamBPlayerIds: bIds,
    })
    setShowAdd(false)
    setNewMatch({ name: '', type: 'singles', section: '', holeStart: 1, holeEnd: round.numHoles })
    setAIds([])
    setBIds([])
  }

  function togglePlayerSide(playerId, side) {
    if (side === 'a') {
      setAIds(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId])
    } else {
      setBIds(prev => prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId])
    }
  }

  return (
    <div>
      <div className="space-y-2 mb-3">
        {round.matches.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-3">No matches yet.</p>
        )}
        {round.matches.map(m => {
          const aNames = m.teamAPlayerIds.map(id => round.players.find(p => p.id === id)?.name).filter(Boolean)
          const bNames = m.teamBPlayerIds.map(id => round.players.find(p => p.id === id)?.name).filter(Boolean)
          return (
            <div key={m.id} className="bg-gray-800/60 rounded-xl border border-gray-700 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white text-sm">{m.name}</span>
                    <span className="text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-bold uppercase">{m.type}</span>
                    <span className="text-[10px] text-gray-500">H{m.holeRange?.[0]}–{m.holeRange?.[1]}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span className="text-blue-300">{aNames.join(' & ') || '—'}</span>
                    <span className="text-gray-600 mx-1">vs</span>
                    <span className="text-red-300">{bNames.join(' & ') || '—'}</span>
                  </div>
                </div>
                <button
                  onClick={() => dispatch({ type: 'REMOVE_MATCH', id: m.id })}
                  className="text-gray-600 hover:text-red-400 px-2 py-1 text-sm shrink-0">✕</button>
              </div>
            </div>
          )
        })}
      </div>

      {showAdd ? (
        <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={newMatch.name}
              onChange={e => setNewMatch(p => ({ ...p, name: e.target.value }))}
              placeholder="Match name (e.g. Fourball 1)"
              className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-green-600 placeholder-gray-600"
            />
          </div>
          <div className="flex gap-2">
            {MATCH_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setNewMatch(p => ({ ...p, type: t.value }))}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${newMatch.type === t.value ? 'border-green-500 bg-green-900/30 text-white' : 'border-gray-700 text-gray-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center text-sm text-gray-400">
            <label className="shrink-0 text-xs">Holes:</label>
            <input type="number" min="1" max={round.numHoles} value={newMatch.holeStart}
              onChange={e => setNewMatch(p => ({ ...p, holeStart: e.target.value }))}
              className="w-14 bg-gray-700 text-white rounded-lg px-2 py-1.5 text-xs border border-gray-600 text-center" />
            <span>to</span>
            <input type="number" min="1" max={round.numHoles} value={newMatch.holeEnd}
              onChange={e => setNewMatch(p => ({ ...p, holeEnd: e.target.value }))}
              className="w-14 bg-gray-700 text-white rounded-lg px-2 py-1.5 text-xs border border-gray-600 text-center" />
          </div>
          <div>
            <input
              value={newMatch.section}
              onChange={e => setNewMatch(p => ({ ...p, section: e.target.value }))}
              placeholder="Section label (e.g. Front 9)"
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-xs border border-gray-600 focus:outline-none placeholder-gray-600"
            />
          </div>
          {round.players.length > 0 && (
            <div>
              <div className="text-xs text-gray-500 mb-2 font-semibold uppercase">Select players:</div>
              <div className="space-y-1">
                {round.players.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <span className="text-sm text-white flex-1">{p.name}</span>
                    <button
                      onClick={() => togglePlayerSide(p.id, 'a')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${aIds.includes(p.id) ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >{teamA?.name || 'Side A'}</button>
                    <button
                      onClick={() => togglePlayerSide(p.id, 'b')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${bIds.includes(p.id) ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                    >{teamB?.name || 'Side B'}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Btn onClick={() => setShowAdd(false)} variant="secondary" className="flex-1">Cancel</Btn>
            <Btn onClick={addMatch} variant="primary" className="flex-1">Add Match</Btn>
          </div>
        </div>
      ) : (
        <Btn onClick={() => setShowAdd(true)} variant="secondary" className="w-full">
          + Add Match
        </Btn>
      )}
    </div>
  )
}

// ─── Section: Ryder Cup Settings ──────────────────────────────────────────────

function RyderSettingsSection({ round, dispatch }) {
  const { scoringMethod, pointsToWin, totalPoints } = round.ryderCupSettings || {}

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Scoring Method</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'matchResult', label: 'Match Result', desc: '1pt per match win' },
            { value: 'holeByHole', label: 'Hole by Hole', desc: '1pt per hole win' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => dispatch({ type: 'UPDATE_RYDER_SETTINGS', patch: { scoringMethod: opt.value } })}
              className={`p-3 rounded-xl border-2 text-left transition-all active:scale-95 ${
                scoringMethod === opt.value
                  ? 'border-green-500 bg-green-900/30 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-400'
              }`}
            >
              <div className="font-bold text-sm">{opt.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Points to Win</label>
          <input
            type="number"
            value={pointsToWin ?? ''}
            onChange={e => dispatch({ type: 'UPDATE_RYDER_SETTINGS', patch: { pointsToWin: Number(e.target.value) } })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600"
          />
        </div>
        {scoringMethod === 'holeByHole' && (
          <div className="flex-1">
            <label className="block text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wide">Total Points</label>
            <input
              type="number"
              value={totalPoints ?? ''}
              onChange={e => dispatch({ type: 'UPDATE_RYDER_SETTINGS', patch: { totalPoints: Number(e.target.value) } })}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-600"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Setup Component ─────────────────────────────────────────────────────

export default function Setup({ round, dispatch, ui, loadPreset, onStart, startNewRound }) {
  const needsTeams = ['matchPlay', 'ryderCup'].includes(round.format)
  const isRyderCup = round.format === 'ryderCup'

  const canStart = round.roundName.trim().length > 0 && round.players.length > 0

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-950 to-gray-950 px-4 pt-8 pb-5 text-center">
        <div className="text-3xl mb-2">⛳</div>
        <h1 className="text-xl font-black uppercase tracking-widest text-white">Golf Score Tracker</h1>
        <p className="text-green-400 text-xs uppercase tracking-widest mt-1 font-semibold">
          {round.roundStarted ? 'Edit Round' : 'New Round Setup'}
        </p>
      </div>

      <div className="px-4 pb-8 space-y-6">

        {/* Preset loader */}
        {!round.roundStarted && (
          <div>
            <SectionTitle>Quick Start</SectionTitle>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => loadPreset(RYDER_CUP_PRESET)}
                className="w-full p-4 rounded-xl border-2 border-green-700 bg-green-900/20 text-left active:scale-95 hover:border-green-500"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="font-bold text-white">Ryder Cup Golf Day</div>
                    <div className="text-xs text-green-400 mt-0.5">12 players · 9 matches · Pre-configured</div>
                  </div>
                </div>
              </button>
              <button
                onClick={startNewRound}
                className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800/50 text-left active:scale-95 hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-semibold text-white text-sm">Blank Round</div>
                    <div className="text-xs text-gray-500 mt-0.5">Start from scratch</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Round info */}
        <div>
          <SectionTitle>Round Details</SectionTitle>
          <RoundInfoSection round={round} dispatch={dispatch} />
        </div>

        {/* Format */}
        <div>
          <SectionTitle>Scoring Format</SectionTitle>
          <FormatSection round={round} dispatch={dispatch} />
        </div>

        {/* Holes */}
        <div>
          <SectionTitle>Course & Holes</SectionTitle>
          <HolesSection round={round} dispatch={dispatch} />
        </div>

        {/* Players */}
        <div>
          <SectionTitle>Players</SectionTitle>
          <PlayersSection round={round} dispatch={dispatch} />
        </div>

        {/* Teams (only for team formats) */}
        {needsTeams && (
          <div>
            <SectionTitle>Teams</SectionTitle>
            <TeamsSection round={round} dispatch={dispatch} />
          </div>
        )}

        {/* Matches */}
        {needsTeams && (
          <div>
            <SectionTitle>Matches</SectionTitle>
            <MatchesSection round={round} dispatch={dispatch} />
          </div>
        )}

        {/* Ryder Cup settings */}
        {isRyderCup && (
          <div>
            <SectionTitle>Ryder Cup Settings</SectionTitle>
            <RyderSettingsSection round={round} dispatch={dispatch} />
          </div>
        )}

        {/* Start / Continue button */}
        <div className="pt-2">
          {!canStart && (
            <p className="text-xs text-gray-600 text-center mb-2">
              Add a round name and at least 1 player to continue.
            </p>
          )}
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`w-full py-4 rounded-2xl text-base font-black uppercase tracking-widest transition-all active:scale-95 ${
              canStart
                ? 'bg-green-600 text-white hover:bg-green-500'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {round.roundStarted ? '▶ Continue Round' : '▶ Start Round'}
          </button>

          {round.roundStarted && (
            <button
              onClick={startNewRound}
              className="w-full mt-2 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-white border border-gray-800 hover:border-gray-700"
            >
              Start New Round
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
