import { useState } from 'react'
import { createCourse, createRound, createRoundPlayers } from '../lib/supabase'

const FORMATS = [
  { id: 'stroke',     label: 'Stroke Play',  desc: 'Total gross minus handicap',   icon: '🏌️' },
  { id: 'stableford', label: 'Stableford',   desc: 'Points per hole vs par + hcp', icon: '⭐' },
  { id: 'match_1v1',  label: 'Match Play',   desc: '1 vs 1 · net score per hole',  icon: '⚔️' },
  { id: 'fourballs',  label: 'Fourballs',    desc: '2 vs 2 · best ball per hole',  icon: '👥' },
]

function defaultHoles(total) {
  return Array.from({ length: total }, (_, i) => ({
    number: i + 1, par: 4, stroke_index: i + 1,
  }))
}

function StepDots({ current, total }) {
  return (
    <div className="flex gap-1.5 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i + 1 === current
              ? 'w-5 h-2 bg-emerald-500'
              : i + 1 < current
              ? 'w-2 h-2 bg-green-800'
              : 'w-2 h-2 bg-gray-700'
          }`}
        />
      ))}
    </div>
  )
}

export default function NewRound({ players, courses, onCreated, onBack }) {
  const today = new Date().toISOString().slice(0, 10)

  const [step, setStep]           = useState(1)
  const [format, setFormat]       = useState('stroke')
  const [date, setDate]           = useState(today)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [customName, setCustomName]         = useState('')
  const [selections, setSelections] = useState(() => {
    const s = {}
    players.forEach(p => { s[p.id] = { checked: false, hcp: String(p.handicap) } })
    return s
  })
  const [teams, setTeams]   = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const isMatch = format === 'match_1v1' || format === 'fourballs'
  const totalSteps = isMatch ? 4 : 3

  const selectedPlayers = players.filter(p => selections[p.id]?.checked)

  // ── Step validation ────────────────────────────────────────────────────────
  function canAdvance() {
    if (step === 1) return format && date
    if (step === 2) return selectedCourse !== null || customName.trim().length > 0
    if (step === 3) {
      if (selectedPlayers.length === 0) return false
      if (format === 'match_1v1' && selectedPlayers.length !== 2) return false
      if (format === 'fourballs' && selectedPlayers.length !== 4) return false
      return selectedPlayers.every(p => {
        const hcp = parseFloat(selections[p.id]?.hcp)
        return !isNaN(hcp) && hcp >= 0
      })
    }
    if (step === 4) {
      const teamA = selectedPlayers.filter(p => teams[p.id] === 1)
      const teamB = selectedPlayers.filter(p => teams[p.id] === 2)
      if (format === 'match_1v1') return teamA.length === 1 && teamB.length === 1
      if (format === 'fourballs') return teamA.length === 2 && teamB.length === 2
    }
    return false
  }

  function handlePlayerToggle(playerId) {
    setSelections(prev => {
      const cur = prev[playerId]
      return { ...prev, [playerId]: { ...cur, checked: !cur.checked } }
    })
  }

  function handleHcpChange(playerId, val) {
    setSelections(prev => ({ ...prev, [playerId]: { ...prev[playerId], hcp: val } }))
  }

  function handleTeamToggle(playerId, team) {
    setTeams(prev => ({ ...prev, [playerId]: team }))
  }

  function handleNext() {
    setError('')
    if (step === 3 && !isMatch) {
      handleSubmit()
      return
    }
    if (step === 4) {
      handleSubmit()
      return
    }
    setStep(s => s + 1)
    // Auto-assign teams when entering step 4
    if (step === 3 && isMatch) {
      const auto = {}
      selectedPlayers.forEach((p, i) => {
        auto[p.id] = i % 2 === 0 ? 1 : 2
      })
      setTeams(auto)
    }
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      let courseId   = selectedCourse?.id ?? null
      let courseHoles = selectedCourse?.holes?.length ? selectedCourse.holes : null
      let totalHoles  = selectedCourse?.total_holes ?? 18

      if (!courseId && customName.trim()) {
        const holes = defaultHoles(18)
        const { data, error: ce } = await createCourse(customName.trim(), 18, holes)
        if (ce) throw new Error(ce.message ?? String(ce))
        courseId    = data.id
        totalHoles  = 18
        courseHoles = holes
      }

      const { data: round, error: re } = await createRound(date, courseId, format, totalHoles)
      if (re) throw new Error(re.message ?? String(re))

      const rpRows = selectedPlayers.map(p => ({
        playerId:        p.id,
        playingHandicap: Math.round(parseFloat(selections[p.id]?.hcp) || 0),
        team:            isMatch ? (teams[p.id] ?? null) : null,
      }))
      const { error: rpe } = await createRoundPlayers(round.id, rpRows)
      if (rpe) throw new Error(rpe.message ?? String(rpe))

      onCreated(round)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  // ── Render steps ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen md:min-h-0 bg-slate-950 pb-10 md:rounded-2xl md:overflow-hidden md:shadow-2xl">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 px-4 pt-6 pb-5 mb-6 flex items-center">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-slate-400 active:scale-90 text-xl shrink-0">
          ←
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black text-white">New Round</h1>
          <div className="mt-2">
            <StepDots current={step} total={totalSteps} />
          </div>
        </div>
        <div className="w-9 shrink-0" />
      </div>

      <div className="px-4 space-y-5">
        {/* Step 1: Format + Date */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Format</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`rounded-2xl p-3.5 text-left transition-all active:scale-95 border ${
                      format === f.id
                        ? 'bg-emerald-900/40 border-green-600 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className="text-xl mb-1">{f.icon}</div>
                    <div className="font-black text-sm">{f.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </>
        )}

        {/* Step 2: Course */}
        {step === 2 && (
          <>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Select Course</label>

            {courses.length === 0 && (
              <div className="text-xs text-slate-500 bg-slate-900 rounded-2xl p-4 border border-slate-800">
                No courses in library yet. Enter a name below or add courses in the Courses tab.
              </div>
            )}

            {courses.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { setSelectedCourse(c); setCustomName('') }}
                className={`w-full rounded-2xl px-4 py-3 text-left border transition-all active:scale-95 mb-2 ${
                  selectedCourse?.id === c.id
                    ? 'bg-emerald-900/40 border-green-600'
                    : 'bg-slate-900 border-slate-700'
                }`}
              >
                <div className="font-bold text-white text-sm">{c.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {c.total_holes} holes{c.holes?.length ? ' · par/SI set' : ''}
                </div>
              </button>
            ))}

            <div className="mt-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Or enter a course name</div>
              <input
                type="text"
                value={customName}
                onChange={e => { setCustomName(e.target.value); setSelectedCourse(null) }}
                placeholder="e.g. Royal Birkdale"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-gray-700"
              />
              {customName.trim() && (
                <p className="text-[10px] text-slate-600 mt-1.5 px-1">
                  A new course with default par will be created. Edit it in the Courses tab to set par & stroke index.
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 3: Players */}
        {step === 3 && (
          <>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Players</label>
              {format === 'match_1v1' && (
                <span className="text-[10px] text-orange-400 font-bold">Select exactly 2</span>
              )}
              {format === 'fourballs' && (
                <span className="text-[10px] text-orange-400 font-bold">Select exactly 4</span>
              )}
            </div>

            {players.length === 0 && (
              <div className="text-xs text-slate-500 bg-slate-900 rounded-2xl p-4 border border-slate-800">
                No players set up yet. Go to the Players tab to add your group first.
              </div>
            )}

            <div className="space-y-2">
              {players.map(p => {
                const sel = selections[p.id]
                return (
                  <div
                    key={p.id}
                    className={`bg-slate-900 rounded-2xl border transition-all ${
                      sel?.checked ? 'border-green-700/60' : 'border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlayerToggle(p.id)}
                      className="w-full flex items-center gap-3 px-4 py-3"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        sel?.checked
                          ? 'bg-emerald-500 border-green-600'
                          : 'border-slate-600 bg-transparent'
                      }`}>
                        {sel?.checked && <span className="text-white text-xs font-black">✓</span>}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-white text-sm truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-500">HCP {p.handicap}</div>
                      </div>
                    </button>

                    {sel?.checked && (
                      <div className="px-4 pb-3 pt-0 flex items-center gap-2">
                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Playing HCP</label>
                        <input
                          type="number"
                          value={sel.hcp}
                          onChange={e => handleHcpChange(p.id, e.target.value)}
                          min="0"
                          max="54"
                          step="1"
                          className="w-20 bg-slate-800 border border-slate-700 text-white text-sm text-center rounded-xl px-2 py-1.5 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Step 4: Teams (match formats only) */}
        {step === 4 && (
          <>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              {format === 'match_1v1' ? 'Assign Sides' : 'Assign Teams'}
            </label>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <div className="text-sm font-black text-blue-300 mb-1">
                  {format === 'match_1v1' ? 'Side A' : 'Team A'}
                </div>
                {selectedPlayers.filter(p => teams[p.id] === 1).map(p => (
                  <div key={p.id} className="text-xs text-white bg-blue-900/30 rounded-xl px-2 py-1 mb-1 border border-blue-800/40">{p.name}</div>
                ))}
                {selectedPlayers.filter(p => teams[p.id] === 1).length === 0 && (
                  <div className="text-xs text-slate-700 italic">None yet</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-red-300 mb-1">
                  {format === 'match_1v1' ? 'Side B' : 'Team B'}
                </div>
                {selectedPlayers.filter(p => teams[p.id] === 2).map(p => (
                  <div key={p.id} className="text-xs text-white bg-red-900/30 rounded-xl px-2 py-1 mb-1 border border-red-800/40">{p.name}</div>
                ))}
                {selectedPlayers.filter(p => teams[p.id] === 2).length === 0 && (
                  <div className="text-xs text-slate-700 italic">None yet</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {selectedPlayers.map(p => (
                <div key={p.id} className="bg-slate-900 rounded-2xl border border-slate-800 px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-500">HCP {selections[p.id]?.hcp}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTeamToggle(p.id, 1)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        teams[p.id] === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {format === 'match_1v1' ? 'A' : 'Team A'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTeamToggle(p.id, 2)}
                      className={`px-3 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                        teams[p.id] === 2
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {format === 'match_1v1' ? 'B' : 'Team B'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <div className="flex gap-2 pt-2">
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep(s => s - 1); setError('') }}
              className="px-6 py-4 bg-slate-800 text-gray-300 font-bold text-sm rounded-2xl active:scale-95 border border-slate-700"
            >
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="flex-1 py-4 bg-emerald-500 text-white font-black text-base rounded-2xl active:scale-95 disabled:opacity-40 transition-all shadow-lg shadow-emerald-900/30"
          >
            {saving
              ? 'Creating…'
              : step === totalSteps
              ? 'Start Round →'
              : 'Next →'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
