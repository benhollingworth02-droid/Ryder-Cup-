import { useState } from 'react'
import { createPlayer, updatePlayer, deletePlayer } from '../lib/supabase'

function PlayerRow({ player }) {
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(player.name)
  const [handicap, setHandicap] = useState(String(player.handicap))
  const [saving, setSaving]     = useState(false)

  async function save() {
    const hcp = parseFloat(handicap)
    if (!name.trim() || isNaN(hcp) || hcp < 0) return
    setSaving(true)
    await updatePlayer(player.id, name.trim(), hcp)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setName(player.name)
    setHandicap(String(player.handicap))
    setEditing(false)
  }

  async function remove() {
    if (!window.confirm(`Remove ${player.name}?`)) return
    await deletePlayer(player.id)
  }

  if (editing) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-3 space-y-2">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && save()}
          placeholder="Player name"
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-3 text-sm border border-gray-600 focus:outline-none focus:border-green-500"
        />
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[9px] text-gray-500 font-bold uppercase tracking-wide mb-1">Handicap</label>
            <input
              type="number"
              value={handicap}
              onChange={e => setHandicap(e.target.value)}
              min="0" max="54" step="0.1"
              className="w-full bg-gray-700 text-white rounded-xl px-3 py-3 text-sm border border-gray-600 focus:outline-none focus:border-green-500"
            />
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50"
          >
            ✓
          </button>
          <button
            onClick={cancel}
            className="px-3 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm font-bold active:scale-95"
          >
            ✕
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{player.name}</div>
        <div className="text-xs text-gray-500 mt-0.5">Handicap {player.handicap}</div>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-white active:scale-90 rounded-xl"
      >
        ✏️
      </button>
      <button
        onClick={remove}
        className="w-9 h-9 flex items-center justify-center text-gray-700 hover:text-red-400 active:scale-90 rounded-xl"
      >
        🗑
      </button>
    </div>
  )
}

function AddPlayerForm() {
  const [name, setName]         = useState('')
  const [handicap, setHandicap] = useState('0')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  async function submit(e) {
    e.preventDefault()
    const hcp = parseFloat(handicap)
    if (!name.trim())          { setError('Enter a name'); return }
    if (isNaN(hcp) || hcp < 0) { setError('Enter a valid handicap'); return }
    setSaving(true)
    const { error: err } = await createPlayer(name.trim(), hcp)
    if (err) { setError(err.message ?? String(err)); setSaving(false); return }
    setName('')
    setHandicap('0')
    setError('')
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Add Player</div>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Player name"
        className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-sm border border-gray-700 focus:outline-none focus:border-green-500 placeholder-gray-700"
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={handicap}
          onChange={e => setHandicap(e.target.value)}
          min="0" max="54" step="0.1"
          placeholder="Handicap"
          className="flex-1 bg-gray-800 text-white rounded-xl px-3 py-3 text-sm border border-gray-700 focus:outline-none focus:border-green-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-3 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50 shrink-0"
        >
          {saving ? '…' : 'Add'}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  )
}

export default function Players({ players }) {
  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-5 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Golf Trip</div>
        <h1 className="text-3xl font-black text-white">Players</h1>
        <p className="text-xs text-gray-600 mt-1.5">Handicap = flat deduction from gross total</p>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-10 text-gray-700 text-sm mb-5">
          No players yet — add your group below
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {players.map(player => (
            <PlayerRow key={player.id} player={player} />
          ))}
        </div>
      )}

      <AddPlayerForm />
    </div>
  )
}
