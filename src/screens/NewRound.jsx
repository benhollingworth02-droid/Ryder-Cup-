import { useState } from 'react'
import { createCourse, createRound, createRoundPlayers } from '../lib/supabase'

const INDIVIDUAL_FORMATS = [
  { id: 'stroke',     label: 'Stroke Play',  desc: 'Individual · gross minus handicap', icon: '🏌️' },
  { id: 'stableford', label: 'Stableford',   desc: 'Individual · points per hole',      icon: '⭐' },
  { id: 'match_1v1',  label: 'Match Play',   desc: '1 vs 1 · net score per hole',       icon: '⚔️' },
  { id: 'fourballs',  label: 'Fourballs',    desc: '2 vs 2 · best ball per hole',       icon: '👥' },
]

const TOURNAMENT_FORMATS = [
  { id: 'ryder_cup',   label: 'Ryder Cup',        desc: 'Teams · fourballs · match play points', icon: '🏆' },
  { id: 'team_stroke', label: 'Team Stroke Play',  desc: 'Teams · individual scores · team total', icon: '🤝' },
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
              ? 'w-2 h-2 bg-emerald-800'
              : 'w-2 h-2 bg-slate-700'
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
  const [team1Name, setTeam1Name] = useState('Team 1')
  const [team2Name, setTeam2Name] = useState('Team 2')
  const [numGroups, setNumGroups] = useState(2)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [customName, setCustomName]         = useState('')

  // Per-player selections (for individual formats)
  const [selections, setSelections] = useState(() => {
    const s = {}
    players.forEach(p => { s[p.id] = { checked: false, hcp: String(p.handicap) } })
    return s
  })
  const [teams, setTeams]   = useState({})

  // Tournament player assignments: { playerId: { groupNum, team } }
  const [groupAssignments, setGroupAssignments] = useState({})
  // Per-player hcp overrides for tournament (reuses selections[p.id].hcp)

  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const isTournament = format === 'ryder_cup' || format === 'team_stroke'
  const isMatch      = format === 'match_1v1' || format === 'fourballs'
  const totalSteps   = isMatch ? 4 : 3

  const selectedPlayers = players.filter(p => selections[p.id]?.checked)

  // ── Validation ─────────────────────────────────────────────────────────────
  function canAdvance() {
    if (step === 1) return !!(format && date)
    if (step === 2) return selectedCourse !== null || customName.trim().length > 0
    if (step === 3) {
      if (isTournament) {
        const assigned = Object.values(groupAssignments).filter(a => a.groupNum && a.team)
        if (assigned.length === 0) return false
        // Each group must have at least 1 player per team
        for (let g = 1; g <= numGroups; g++) {
          const gPlayers = Object.values(groupAssignments).filter(a => a.groupNum === g)
          const hasT1 = gPlayers.some(a => a.team === 1)
          const hasT2 = gPlayers.some(a => a.team === 2)
          if (!hasT1 || !hasT2) return false
        }
        return true
      }
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

  function handlePlayerToggle(id) {
    setSelections(prev => ({ ...prev, [id]: { ...prev[id], checked: !prev[id].checked } }))
  }

  function handleHcpChange(id, val) {
    setSelections(prev => ({ ...prev, [id]: { ...prev[id], hcp: val } }))
  }

  function handleTeamToggle(id, team) {
    setTeams(prev => ({ ...prev, [id]: team }))
  }

  function assignGroup(playerId, groupNum) {
    setGroupAssignments(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), groupNum },
    }))
  }

  function assignTeam(playerId, team) {
    setGroupAssignments(prev => ({
      ...prev,
      [playerId]: { ...(prev[playerId] ?? {}), team },
    }))
  }

  function clearAssignment(playerId) {
    setGroupAssignments(prev => {
      const n = { ...prev }
      delete n[playerId]
      return n
    })
  }

  function handleNext() {
    setError('')
    const isLastStep = isTournament ? step === 3 : step === totalSteps
    if (isLastStep) { handleSubmit(); return }
    if (step === 3 && isMatch) {
      const auto = {}
      selectedPlayers.forEach((p, i) => { auto[p.id] = i % 2 === 0 ? 1 : 2 })
      setTeams(auto)
    }
    setStep(s => s + 1)
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    try {
      let courseId   = selectedCourse?.id ?? null
      let totalHoles = selectedCourse?.total_holes ?? 18

      if (!courseId && customName.trim()) {
        const holes = defaultHoles(18)
        const { data, error: ce } = await createCourse(customName.trim(), 18, holes)
        if (ce) throw new Error(ce.message ?? String(ce))
        courseId   = data.id
        totalHoles = 18
      }

      const { data: round, error: re } = await createRound(
        date, courseId, format, totalHoles,
        isTournament ? team1Name : null,
        isTournament ? team2Name : null,
      )
      if (re) throw new Error(re.message ?? String(re))

      let rpRows
      if (isTournament) {
        rpRows = Object.entries(groupAssignments)
          .filter(([_, a]) => a.groupNum && a.team)
          .map(([playerId, a]) => ({
            playerId,
            playingHandicap: Math.round(parseFloat(selections[playerId]?.hcp) || 0),
            team: a.team,
            groupNum: a.groupNum,
          }))
      } else {
        rpRows = selectedPlayers.map(p => ({
          playerId:        p.id,
          playingHandicap: Math.round(parseFloat(selections[p.id]?.hcp) || 0),
          team:            isMatch ? (teams[p.id] ?? null) : null,
          groupNum:        null,
        }))
      }

      const { error: rpe } = await createRoundPlayers(round.id, rpRows)
      if (rpe) throw new Error(rpe.message ?? String(rpe))

      onCreated(round)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  const isLastStep = isTournament ? step === 3 : step === totalSteps

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen md:min-h-0 bg-slate-950 pb-10 md:rounded-2xl md:overflow-hidden md:shadow-2xl">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 pt-6 pb-5 mb-6 flex items-center">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-slate-400 active:scale-90 text-xl shrink-0">
          ←
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-black text-white">New Round</h1>
          <div className="mt-2">
            <StepDots current={step} total={isTournament ? 3 : totalSteps} />
          </div>
        </div>
        <div className="w-9 shrink-0" />
      </div>

      <div className="px-4 space-y-5">

        {/* ── Step 1: Format + Date ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Individual</label>
              <div className="grid grid-cols-2 gap-2">
                {INDIVIDUAL_FORMATS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`rounded-2xl p-3.5 text-left transition-all active:scale-95 border ${
                      format === f.id
                        ? 'bg-emerald-900/40 border-emerald-600 text-white'
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
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tournament / Team Day</label>
              <div className="grid grid-cols-2 gap-2">
                {TOURNAMENT_FORMATS.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`rounded-2xl p-3.5 text-left transition-all active:scale-95 border ${
                      format === f.id
                        ? 'bg-amber-900/40 border-amber-500 text-white'
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

            {isTournament && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Names</div>
                <div className="flex gap-2">
                  <input
                    value={team1Name}
                    onChange={e => setTeam1Name(e.target.value)}
                    placeholder="Team 1"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    value={team2Name}
                    onChange={e => setTeam2Name(e.target.value)}
                    placeholder="Team 2"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Number of Fourballs</div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumGroups(n)}
                        className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all active:scale-95 ${
                          numGroups === n
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

        {/* ── Step 2: Course ─────────────────────────────────────────────────── */}
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
                    ? 'bg-emerald-900/40 border-emerald-600'
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
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-emerald-500 placeholder-slate-700"
              />
              {customName.trim() && (
                <p className="text-[10px] text-slate-600 mt-1.5 px-1">
                  A new course with default par will be created. Edit it in the Courses tab to set par & stroke index.
                </p>
              )}
            </div>
          </>
        )}

        {/* ── Step 3: Players (individual formats) ──────────────────────────── */}
        {step === 3 && !isTournament && (
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
                No players yet. Go to the Players tab to add your group first.
              </div>
            )}

            <div className="space-y-2">
              {players.map(p => {
                const sel = selections[p.id]
                return (
                  <div
                    key={p.id}
                    className={`bg-slate-900 rounded-2xl border transition-all ${
                      sel?.checked ? 'border-emerald-700/60' : 'border-slate-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlayerToggle(p.id)}
                      className="w-full flex items-center gap-3 px-4 py-3"
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        sel?.checked
                          ? 'bg-emerald-500 border-emerald-600'
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
                          min="0" max="54" step="1"
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

        {/* ── Step 3: Assign players to fourballs (tournament formats) ──────── */}
        {step === 3 && isTournament && (
          <>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
              Assign Players to Fourballs
            </div>
            <div className="text-xs text-slate-600 mb-4">
              For each player: pick their fourball (FB) and team
            </div>

            {players.length === 0 && (
              <div className="text-xs text-slate-500 bg-slate-900 rounded-2xl p-4 border border-slate-800">
                No players yet. Go to the Players tab to add your group first.
              </div>
            )}

            <div className="space-y-2">
              {players.map(p => {
                const a   = groupAssignments[p.id]
                const hcp = selections[p.id]?.hcp ?? String(p.handicap)
                return (
                  <div key={p.id} className={`bg-slate-900 rounded-2xl border p-3.5 transition-all ${
                    a?.groupNum && a?.team ? 'border-slate-700' : 'border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white text-sm truncate">{p.name}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">HCP</span>
                        <input
                          type="number"
                          value={hcp}
                          onChange={e => handleHcpChange(p.id, e.target.value)}
                          min="0" max="54" step="1"
                          className="w-14 bg-slate-800 border border-slate-700 text-white text-xs text-center rounded-lg px-1.5 py-1 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      {a?.groupNum && (
                        <button
                          type="button"
                          onClick={() => clearAssignment(p.id)}
                          className="text-slate-600 text-xs px-1 active:scale-90"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Fourball group buttons */}
                    <div className="flex gap-1.5 mb-2">
                      {Array.from({ length: numGroups }, (_, i) => i + 1).map(g => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => assignGroup(p.id, g)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                            a?.groupNum === g
                              ? 'bg-slate-600 text-white border border-slate-500'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          FB{g}
                        </button>
                      ))}
                    </div>

                    {/* Team buttons (only shown once a group is selected) */}
                    {a?.groupNum && (
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => assignTeam(p.id, 1)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                            a.team === 1
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {team1Name}
                        </button>
                        <button
                          type="button"
                          onClick={() => assignTeam(p.id, 2)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                            a.team === 2
                              ? 'bg-sky-600 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {team2Name}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Fourball summary */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 mt-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Summary</div>
              {Array.from({ length: numGroups }, (_, i) => i + 1).map(g => {
                const t1 = players.filter(p => groupAssignments[p.id]?.groupNum === g && groupAssignments[p.id]?.team === 1)
                const t2 = players.filter(p => groupAssignments[p.id]?.groupNum === g && groupAssignments[p.id]?.team === 2)
                return (
                  <div key={g} className="mb-3 last:mb-0">
                    <div className="text-xs font-black text-slate-400 mb-1.5">Fourball {g}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-[10px] text-emerald-500 font-bold mb-1">{team1Name}</div>
                        {t1.length ? t1.map(p => (
                          <div key={p.id} className="text-xs text-white truncate">{p.name}</div>
                        )) : <div className="text-xs text-slate-700 italic">None</div>}
                      </div>
                      <div>
                        <div className="text-[10px] text-sky-400 font-bold mb-1">{team2Name}</div>
                        {t2.length ? t2.map(p => (
                          <div key={p.id} className="text-xs text-white truncate">{p.name}</div>
                        )) : <div className="text-xs text-slate-700 italic">None</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Step 4: Teams (match formats only) ───────────────────────────── */}
        {step === 4 && (
          <>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
              {format === 'match_1v1' ? 'Assign Sides' : 'Assign Teams'}
            </label>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center">
                <div className="text-sm font-black text-blue-300 mb-1">Side A</div>
                {selectedPlayers.filter(p => teams[p.id] === 1).map(p => (
                  <div key={p.id} className="text-xs text-white bg-blue-900/30 rounded-xl px-2 py-1 mb-1 border border-blue-800/40">{p.name}</div>
                ))}
                {selectedPlayers.filter(p => teams[p.id] === 1).length === 0 && (
                  <div className="text-xs text-slate-700 italic">None yet</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-red-300 mb-1">Side B</div>
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
                      A
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
                      B
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
              className="px-6 py-4 bg-slate-800 text-slate-300 font-bold text-sm rounded-2xl active:scale-95 border border-slate-700"
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
            {saving ? 'Creating…' : isLastStep ? 'Start Round →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
