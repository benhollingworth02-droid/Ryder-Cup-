import { exportRoundText } from '../utils/scoring'

function Btn({ children, onClick, variant = 'secondary', className = '' }) {
  const base = 'w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 text-left'
  const variants = {
    primary:   'bg-green-600 text-white hover:bg-green-500',
    secondary: 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700',
    danger:    'bg-red-900/50 text-red-300 border border-red-800 hover:bg-red-900/80',
    ghost:     'text-gray-500 hover:text-white border border-gray-800 hover:border-gray-700',
  }
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-1">
      <div className="h-px flex-1 bg-gray-800" />
      <h2 className="text-[10px] font-black uppercase tracking-widest text-green-400 whitespace-nowrap">{children}</h2>
      <div className="h-px flex-1 bg-gray-800" />
    </div>
  )
}

function SavedRoundCard({ entry, onLoad, onDelete }) {
  const formatLabel = {
    strokePlay: 'Stroke', stableford: 'Stableford',
    matchPlay: 'Match', ryderCup: 'Ryder Cup',
  }

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm truncate">
            {entry.roundName || 'Untitled Round'}
          </div>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
            {entry.courseName && (
              <span className="text-xs text-gray-500">{entry.courseName}</span>
            )}
            {entry.date && (
              <span className="text-xs text-gray-600">{entry.date}</span>
            )}
            <span className="text-xs text-green-700 font-semibold">
              {formatLabel[entry.format] || entry.format}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={onLoad}
            className="px-3 py-1.5 bg-green-700/60 text-green-300 rounded-lg text-xs font-bold border border-green-700/40 active:scale-95"
          >
            Load
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1.5 text-gray-600 hover:text-red-400 rounded-lg text-xs active:scale-95"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Settings({ round, dispatch, ui, confirm, saveCurrentRound, loadSavedRound, deleteSavedRound, startNewRound, setTab }) {

  function handleExport() {
    const text = exportRoundText(round)
    if (navigator.share) {
      navigator.share({ title: round.roundName || 'Golf Round', text }).catch(() => {})
    } else {
      const el = document.createElement('textarea')
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      alert('Round summary copied to clipboard!')
    }
  }

  function handleClearAll() {
    confirm(
      'This will delete all data including saved rounds. Are you sure?',
      () => {
        localStorage.clear()
        window.location.reload()
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-10">
      <div className="bg-gradient-to-b from-green-950 to-gray-950 -mx-4 px-4 pt-6 pb-5 mb-2">
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-0.5">Golf Score Tracker</div>
          <h1 className="text-xl font-black text-white">Settings</h1>
        </div>
      </div>

      {/* Current round actions */}
      {round?.roundStarted && (
        <div>
          <SectionTitle>Current Round</SectionTitle>
          <div className="space-y-2">
            <Btn onClick={saveCurrentRound} variant="primary">
              💾 Save Round to History
            </Btn>
            <Btn onClick={handleExport} variant="secondary">
              📤 Export / Share Round Summary
            </Btn>
            <Btn onClick={() => setTab('setup')} variant="secondary">
              ✏️ Edit Round Setup
            </Btn>
          </div>
        </div>
      )}

      {/* Reset options */}
      {round?.roundStarted && (
        <div>
          <SectionTitle>Reset</SectionTitle>
          <div className="space-y-2">
            <Btn
              variant="danger"
              onClick={() => confirm('Reset all scores? Player setup will be kept.', () => {
                dispatch({ type: 'RESET_SCORES' })
              })}
            >
              🔄 Reset Scores Only
            </Btn>
            <Btn
              variant="danger"
              onClick={() => confirm('Reset players? This will also clear scores and matches.', () => {
                dispatch({ type: 'RESET_PLAYERS' })
              })}
            >
              👤 Reset Players
            </Btn>
            <Btn
              variant="danger"
              onClick={() => confirm('Reset teams and matches?', () => {
                dispatch({ type: 'RESET_TEAMS' })
              })}
            >
              🏳️ Reset Teams & Matches
            </Btn>
            <Btn
              variant="danger"
              onClick={() => confirm('Reset hole pars to all par 4?', () => {
                dispatch({ type: 'RESET_HOLES' })
              })}
            >
              ⛳ Reset Hole Pars
            </Btn>
            <Btn
              variant="danger"
              onClick={() => confirm('Start a completely new round? Current round will be lost unless saved.', () => {
                startNewRound()
              })}
            >
              ♻️ Start New Round
            </Btn>
          </div>
        </div>
      )}

      {/* Saved rounds */}
      <div>
        <SectionTitle>Saved Rounds ({ui.savedRounds.length})</SectionTitle>
        {ui.savedRounds.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-4">No saved rounds yet. Use "Save Round" above.</p>
        ) : (
          <div className="space-y-2">
            {ui.savedRounds.map(entry => (
              <SavedRoundCard
                key={entry.id}
                entry={entry}
                onLoad={() => confirm('Load this round? Unsaved changes will be lost.', () => {
                  loadSavedRound(entry)
                })}
                onDelete={() => confirm('Delete this saved round?', () => {
                  deleteSavedRound(entry.id)
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div>
        <SectionTitle>Danger Zone</SectionTitle>
        <Btn variant="danger" onClick={handleClearAll}>
          🗑️ Clear All App Data
        </Btn>
        <p className="text-xs text-gray-700 mt-2 text-center">
          Removes all rounds, history and settings from this device.
        </p>
      </div>

      {/* App info */}
      <div className="mt-8 text-center text-xs text-gray-700 space-y-1">
        <p className="font-bold text-gray-600">Golf Score Tracker</p>
        <p>Supports Stroke Play · Stableford · Match Play · Ryder Cup</p>
        <p>All data stored locally on this device</p>
      </div>
    </div>
  )
}
