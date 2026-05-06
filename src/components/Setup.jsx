import { useState } from 'react'

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-5">
      <div className="h-px flex-1 bg-gray-800" />
      <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">{children}</h2>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function EditableNameRow({ label, value, onSave, color }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function save() {
    if (draft.trim()) onSave(draft.trim())
    setEditing(false)
  }

  const dotColor = color === 'blue' ? 'bg-blue-500' : 'bg-red-500'

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl border border-gray-700 px-3 py-2">
        {label && <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wide shrink-0">{label}</span>}
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save() }}
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-green-600 min-w-0"
        />
        <button
          onClick={save}
          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-bold active:scale-95 shrink-0"
        >
          ✓
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-xl border border-gray-800 px-3 py-2.5">
      {color && <span className={`w-2 h-2 rounded-full ${dotColor} shrink-0`} />}
      {label && <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wide shrink-0">{label}</span>}
      <span className="flex-1 text-sm font-semibold text-white">{value}</span>
      <button
        onClick={() => { setDraft(value); setEditing(true) }}
        className="text-gray-500 hover:text-white text-sm px-2 py-1 active:scale-95"
      >
        ✏️
      </button>
    </div>
  )
}

export default function Setup({ state, dispatch }) {
  const teamH = state.teams[0]
  const teamW = state.teams[1]
  const hPlayers = state.players.filter(p => p.teamId === 'team-h')
  const wPlayers = state.players.filter(p => p.teamId === 'team-w')

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-10">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-6 pb-5 mb-1 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">The Bromsgrove Cup</div>
        <h1 className="text-xl font-black text-white">Setup</h1>
        <p className="text-xs text-gray-600 mt-1">Edit names and hole pars. Changes apply immediately.</p>
      </div>

      {/* Teams */}
      <SectionTitle>Team Names</SectionTitle>
      <div className="space-y-2">
        <EditableNameRow
          value={teamH.name}
          color="blue"
          onSave={name => dispatch({ type: 'UPDATE_TEAM_NAME', teamId: 'team-h', name })}
        />
        <EditableNameRow
          value={teamW.name}
          color="red"
          onSave={name => dispatch({ type: 'UPDATE_TEAM_NAME', teamId: 'team-w', name })}
        />
      </div>

      {/* Blue team players */}
      <SectionTitle>{teamH.name} Players</SectionTitle>
      <div className="space-y-2">
        {hPlayers.map((p, i) => (
          <EditableNameRow
            key={p.id}
            label={`P${i + 1}`}
            value={p.name}
            color="blue"
            onSave={name => dispatch({ type: 'UPDATE_PLAYER_NAME', playerId: p.id, name })}
          />
        ))}
      </div>

      {/* Red team players */}
      <SectionTitle>{teamW.name} Players</SectionTitle>
      <div className="space-y-2">
        {wPlayers.map((p, i) => (
          <EditableNameRow
            key={p.id}
            label={`P${i + 1}`}
            value={p.name}
            color="red"
            onSave={name => dispatch({ type: 'UPDATE_PLAYER_NAME', playerId: p.id, name })}
          />
        ))}
      </div>

      {/* Hole pars */}
      <SectionTitle>Hole Pars</SectionTitle>
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-gray-800">
          {/* Front 9 */}
          <div>
            <div className="px-3 py-1.5 bg-gray-800/60 text-[10px] font-black uppercase tracking-widest text-gray-500">Front 9</div>
            {state.holes.slice(0, 9).map(hole => (
              <div key={hole.number} className="flex items-center border-t border-gray-800 px-3 py-1.5">
                <span className="text-xs text-gray-500 font-bold w-6">H{hole.number}</span>
                <div className="flex gap-1 ml-auto">
                  {[3, 4, 5].map(par => (
                    <button
                      key={par}
                      onClick={() => dispatch({ type: 'UPDATE_HOLE_PAR', holeNumber: hole.number, par })}
                      className={`w-8 h-7 rounded-lg text-xs font-black active:scale-95 transition-all ${
                        hole.par === par
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}
                    >
                      {par}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/* Back 9 */}
          <div>
            <div className="px-3 py-1.5 bg-gray-800/60 text-[10px] font-black uppercase tracking-widest text-gray-500">Back 9</div>
            {state.holes.slice(9, 18).map(hole => (
              <div key={hole.number} className="flex items-center border-t border-gray-800 px-3 py-1.5">
                <span className="text-xs text-gray-500 font-bold w-7">H{hole.number}</span>
                <div className="flex gap-1 ml-auto">
                  {[3, 4, 5].map(par => (
                    <button
                      key={par}
                      onClick={() => dispatch({ type: 'UPDATE_HOLE_PAR', holeNumber: hole.number, par })}
                      className={`w-8 h-7 rounded-lg text-xs font-black active:scale-95 transition-all ${
                        hole.par === par
                          ? 'bg-green-700 text-white'
                          : 'bg-gray-800 text-gray-500 border border-gray-700'
                      }`}
                    >
                      {par}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-2 border-t border-gray-800 text-center">
          <span className="text-xs text-gray-600">
            Total par: {state.holes.reduce((s, h) => s + h.par, 0)}
          </span>
        </div>
      </div>
    </div>
  )
}
