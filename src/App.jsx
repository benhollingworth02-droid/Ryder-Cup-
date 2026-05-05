import { useState, useEffect } from 'react'

const ADMIN_PIN = '1234'

const INITIAL_MATCHES = {
  fourballs: [
    {
      id: 'fb1',
      num: 1,
      hollingworth: ['Nick Jacobsen', 'Seb Mehjoo'],
      wagstaff: ['Alex Griffiths', 'Tom Reynolds'],
      result: null,
    },
    {
      id: 'fb2',
      num: 2,
      hollingworth: ['Pearce Childs', 'Fin Morgan'],
      wagstaff: ['Will Upton', 'Ed Wagstaff'],
      result: null,
    },
    {
      id: 'fb3',
      num: 3,
      hollingworth: ['Joe Colebrook', 'Ben Hollingworth'],
      wagstaff: ['Max Campbell', 'Euan Vaugh-Hawkins'],
      result: null,
    },
  ],
  singles: [
    { id: 's1', num: 1, hollingworth: 'Nick Jacobsen', wagstaff: 'Alex Griffiths', result: null },
    { id: 's2', num: 2, hollingworth: 'Pearce Childs', wagstaff: 'Will Upton', result: null },
    { id: 's3', num: 3, hollingworth: 'Joe Colebrook', wagstaff: 'Max Campbell', result: null },
    { id: 's4', num: 4, hollingworth: 'Ben Hollingworth', wagstaff: 'Euan Vaugh-Hawkins', result: null },
    { id: 's5', num: 5, hollingworth: 'Fin Morgan', wagstaff: 'Ed Wagstaff', result: null },
    { id: 's6', num: 6, hollingworth: 'Seb Mehjoo', wagstaff: 'Tom Reynolds', result: null },
  ],
}

function calcScores(matches) {
  let h = 0, w = 0
  const all = [...matches.fourballs, ...matches.singles]
  for (const m of all) {
    if (m.result === 'hollingworth') { h += 1 }
    else if (m.result === 'wagstaff') { w += 1 }
    else if (m.result === 'halved') { h += 0.5; w += 0.5 }
  }
  return { h, w }
}

function fmt(n) {
  return n % 1 === 0 ? String(n) : n.toFixed(1)
}

function getStatus(h, w) {
  if (h >= 5 && h > w) return { msg: 'Team Hollingworth win the Ryder Cup!', winner: 'hollingworth' }
  if (w >= 5 && w > h) return { msg: 'Team Wagstaff win the Ryder Cup!', winner: 'wagstaff' }
  if (h > w) return { msg: `Team Hollingworth lead ${fmt(h)}–${fmt(w)}`, winner: null }
  if (w > h) return { msg: `Team Wagstaff lead ${fmt(w)}–${fmt(h)}`, winner: null }
  if (h === 0 && w === 0) return { msg: 'Tournament underway — no results yet', winner: null }
  return { msg: `Match tied ${fmt(h)}–${fmt(w)}`, winner: null }
}

const RESULT_OPTS = [
  { value: 'hollingworth', label: 'Hollingworth Win' },
  { value: 'wagstaff', label: 'Wagstaff Win' },
  { value: 'halved', label: 'Halved' },
  { value: null, label: 'Not Played' },
]

function MatchCard({ match, isFourball, isAdmin, onChange }) {
  const { result } = match
  const holName = isFourball ? match.hollingworth.join(' & ') : match.hollingworth
  const wagName = isFourball ? match.wagstaff.join(' & ') : match.wagstaff

  const borderColor =
    result === 'hollingworth' ? 'border-blue-600' :
    result === 'wagstaff' ? 'border-red-600' :
    result === 'halved' ? 'border-amber-500' :
    'border-gray-700'

  const bgColor =
    result === 'hollingworth' ? 'bg-blue-950/70' :
    result === 'wagstaff' ? 'bg-red-950/70' :
    result === 'halved' ? 'bg-amber-950/50' :
    'bg-gray-800/60'

  const pointsLabel =
    result === 'hollingworth' ? '1pt → Hollingworth' :
    result === 'wagstaff' ? '1pt → Wagstaff' :
    result === 'halved' ? '½pt each' :
    null

  return (
    <div className={`rounded-2xl border-2 p-4 mb-3 transition-all duration-300 ${bgColor} ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
          {isFourball ? `Fourball ${match.num}` : `Singles ${match.num}`}
        </span>
        {pointsLabel && (
          <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wide ${
            result === 'hollingworth' ? 'bg-blue-600 text-white' :
            result === 'wagstaff' ? 'bg-red-600 text-white' :
            'bg-amber-500 text-white'
          }`}>
            {pointsLabel}
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2 mb-4">
        <div className={`flex-1 rounded-xl p-3 text-center transition-all duration-300 ${
          result === 'hollingworth' ? 'bg-blue-700/50 ring-2 ring-blue-500/50' :
          result === 'halved' ? 'bg-blue-900/30' : 'bg-gray-700/40'
        }`}>
          <div className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1.5">Hollingworth</div>
          <div className="text-sm font-bold text-white leading-snug">{holName}</div>
          {result === 'hollingworth' && <div className="text-lg mt-1">✓</div>}
          {result === 'halved' && <div className="text-sm mt-1 text-amber-400">½</div>}
        </div>
        <div className="flex items-center text-gray-600 font-black text-sm shrink-0">VS</div>
        <div className={`flex-1 rounded-xl p-3 text-center transition-all duration-300 ${
          result === 'wagstaff' ? 'bg-red-700/50 ring-2 ring-red-500/50' :
          result === 'halved' ? 'bg-red-900/30' : 'bg-gray-700/40'
        }`}>
          <div className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1.5">Wagstaff</div>
          <div className="text-sm font-bold text-white leading-snug">{wagName}</div>
          {result === 'wagstaff' && <div className="text-lg mt-1">✓</div>}
          {result === 'halved' && <div className="text-sm mt-1 text-amber-400">½</div>}
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-2">
          {RESULT_OPTS.map(opt => {
            const isActive = result === opt.value
            const activeStyle =
              opt.value === 'hollingworth' ? 'bg-blue-600 border-blue-500 text-white ring-2 ring-blue-400/40' :
              opt.value === 'wagstaff' ? 'bg-red-600 border-red-500 text-white ring-2 ring-red-400/40' :
              opt.value === 'halved' ? 'bg-amber-500 border-amber-400 text-white ring-2 ring-amber-300/40' :
              'bg-gray-600 border-gray-500 text-white ring-2 ring-gray-400/40'
            return (
              <button
                key={String(opt.value)}
                onClick={() => onChange(match.id, opt.value)}
                className={`py-3 px-2 rounded-xl border-2 text-xs font-black uppercase tracking-wide transition-all active:scale-95 ${
                  isActive ? activeStyle : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {!isAdmin && !result && (
        <div className="text-center text-xs text-gray-600 italic">Not yet played</div>
      )}
    </div>
  )
}

function PinModal({ onSuccess, onClose }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pin === ADMIN_PIN) { onSuccess() }
    else { setError(true); setPin('') }
  }

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-xs border border-gray-700 shadow-2xl">
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">🔒</div>
          <h3 className="text-white font-black text-xl">Admin Access</h3>
          <p className="text-gray-400 text-sm mt-1">Enter PIN to update scores</p>
        </div>
        <form onSubmit={submit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            placeholder="• • • •"
            className="w-full bg-gray-800 text-white text-center text-3xl tracking-widest rounded-xl p-4 border-2 border-gray-700 focus:border-blue-500 outline-none mb-3 placeholder-gray-700"
            autoFocus
          />
          {error && <p className="text-red-400 text-sm text-center mb-3 font-semibold">Incorrect PIN. Try again.</p>}
          <div className="flex gap-3 mt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-gray-800 text-gray-300 font-bold border border-gray-700 active:scale-95">
              Cancel
            </button>
            <button type="submit" className="flex-1 py-3.5 rounded-xl bg-blue-600 text-white font-black active:scale-95 hover:bg-blue-500">
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResetModal({ onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-xs border border-gray-700 shadow-2xl text-center">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-white font-black text-xl mb-2">Reset All Scores?</h3>
        <p className="text-gray-400 text-sm mb-6">All match results will be cleared. This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl bg-gray-800 text-gray-300 font-bold border border-gray-700 active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-3.5 rounded-xl bg-red-600 text-white font-black active:scale-95 hover:bg-red-500">
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [matches, setMatches] = useState(() => {
    try {
      const saved = localStorage.getItem('ryderCupScores_v1')
      return saved ? JSON.parse(saved) : INITIAL_MATCHES
    } catch {
      return INITIAL_MATCHES
    }
  })
  const [isAdmin, setIsAdmin] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    localStorage.setItem('ryderCupScores_v1', JSON.stringify(matches))
  }, [matches])

  const { h, w } = calcScores(matches)
  const { msg, winner } = getStatus(h, w)
  const completed = [...matches.fourballs, ...matches.singles].filter(m => m.result !== null).length
  const total = 9

  function handleResult(matchId, result) {
    setMatches(prev => ({
      fourballs: prev.fourballs.map(m => m.id === matchId ? { ...m, result } : m),
      singles: prev.singles.map(m => m.id === matchId ? { ...m, result } : m),
    }))
  }

  function handleReset() {
    setMatches(INITIAL_MATCHES)
    setShowReset(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-950 via-gray-900 to-gray-950 text-white">
      {showPin && (
        <PinModal
          onSuccess={() => { setIsAdmin(true); setShowPin(false) }}
          onClose={() => setShowPin(false)}
        />
      )}
      {showReset && (
        <ResetModal onConfirm={handleReset} onClose={() => setShowReset(false)} />
      )}

      {/* ── HEADER / SCOREBOARD ── */}
      <div className="bg-gradient-to-b from-green-900 to-green-950 shadow-2xl">
        <div className="px-4 pt-8 pb-2 text-center">
          <div className="text-3xl mb-1">⛳</div>
          <h1 className="text-2xl font-black uppercase tracking-widest text-white leading-tight">
            Ryder Cup Golf Day
          </h1>
          <p className="text-green-400 text-[11px] uppercase tracking-widest mt-1 font-semibold">
            Match Play · 9 Points Available · First to 5 wins
          </p>
        </div>

        {/* Main scoreboard */}
        <div className="mx-4 mt-4 rounded-2xl bg-black/40 border border-green-800/40 overflow-hidden">
          <div className="flex">
            <div className={`flex-1 py-5 px-3 text-center border-r border-green-900/50 ${winner === 'hollingworth' ? 'bg-blue-900/40' : ''}`}>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Team Hollingworth</div>
              <div className={`font-black tabular-nums leading-none ${winner === 'hollingworth' ? 'text-yellow-300 text-6xl' : 'text-blue-200 text-6xl'}`}>
                {fmt(h)}
              </div>
            </div>
            <div className={`flex-1 py-5 px-3 text-center ${winner === 'wagstaff' ? 'bg-red-900/40' : ''}`}>
              <div className="text-[10px] font-black uppercase tracking-widest text-red-300 mb-2">Team Wagstaff</div>
              <div className={`font-black tabular-nums leading-none ${winner === 'wagstaff' ? 'text-yellow-300 text-6xl' : 'text-red-200 text-6xl'}`}>
                {fmt(w)}
              </div>
            </div>
          </div>

          <div className={`py-3 px-4 text-center border-t border-green-900/50 ${winner ? 'bg-yellow-900/20' : 'bg-black/20'}`}>
            <p className={`text-sm font-bold leading-tight ${
              winner ? 'text-yellow-300' :
              h > w ? 'text-blue-300' :
              w > h ? 'text-red-300' :
              'text-amber-300'
            }`}>
              {winner && <span className="mr-1">🏆</span>}{msg}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mx-4 mt-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-800/60 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 rounded-full transition-all duration-700"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">
              {completed} of {total} played
            </span>
          </div>
        </div>

        {/* Winner celebration */}
        {winner && (
          <div className="mx-4 mb-4 py-4 rounded-2xl bg-yellow-900/30 border-2 border-yellow-600/50 text-center">
            <div className="text-5xl mb-2">🏆</div>
            <p className="text-yellow-200 font-black text-lg uppercase tracking-wide">
              {winner === 'hollingworth' ? 'Team Hollingworth' : 'Team Wagstaff'}
            </p>
            <p className="text-yellow-400 text-sm font-semibold mt-1">Win the Ryder Cup Golf Day!</p>
          </div>
        )}

        {/* Admin bar */}
        <div className="flex items-center justify-between px-4 pb-4 gap-2">
          {isAdmin ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-900/60 text-green-300 border border-green-700/60 px-3 py-1.5 rounded-full font-bold">
                🔓 Admin mode active
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReset(true)}
                  className="text-xs px-3 py-2 rounded-xl bg-red-900/50 text-red-300 border border-red-800/50 font-bold active:scale-95"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsAdmin(false)}
                  className="text-xs px-3 py-2 rounded-xl bg-gray-800/60 text-gray-300 border border-gray-700 font-bold active:scale-95"
                >
                  Exit Admin
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setShowPin(true)}
              className="ml-auto text-xs px-3 py-2 rounded-xl bg-gray-800/60 text-gray-400 border border-gray-700 font-bold active:scale-95"
            >
              🔒 Admin Login
            </button>
          )}
        </div>
      </div>

      {/* ── MATCHES ── */}
      <div className="px-4 pt-6 pb-8 max-w-lg mx-auto">
        {/* Front 9 Fourballs */}
        <SectionHeader title="Front 9 — Fourballs" subtitle="3 matches · 1 point each" />
        {matches.fourballs.map(m => (
          <MatchCard key={m.id} match={m} isFourball isAdmin={isAdmin} onChange={handleResult} />
        ))}

        <div className="my-6 border-t border-gray-800" />

        {/* Back 9 Singles */}
        <SectionHeader title="Back 9 — Singles" subtitle="6 matches · 1 point each" />
        {matches.singles.map(m => (
          <MatchCard key={m.id} match={m} isFourball={false} isAdmin={isAdmin} onChange={handleResult} />
        ))}

        {/* Footer */}
        <div className="text-center text-xs text-gray-700 mt-8 space-y-1">
          <p className="font-semibold">First to 5 points wins · Halved = 0.5pts each</p>
          <p>Scores saved on your device · Admin PIN required to edit</p>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4 text-center">
      <h2 className="text-sm font-black uppercase tracking-widest text-green-400">⛳ {title}</h2>
      <p className="text-xs text-gray-600 mt-0.5 font-medium">{subtitle}</p>
    </div>
  )
}
