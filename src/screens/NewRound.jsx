import { useState } from 'react'
import { createRound } from '../lib/supabase'

export default function NewRound({ onCreated, onBack }) {
  const today = new Date().toISOString().slice(0, 10)

  const [date, setDate]     = useState(today)
  const [course, setCourse] = useState('')
  const [holes, setHoles]   = useState(18)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!course.trim()) { setError('Enter a course name'); return }
    setSaving(true)
    const { data, error: err } = await createRound(date, course.trim(), holes)
    if (err) { setError(err.message ?? String(err)); setSaving(false); return }
    onCreated(data)
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-10">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-6 pb-5 mb-6 flex items-center">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center text-gray-400 active:scale-90 text-xl leading-none shrink-0">
          ←
        </button>
        <h1 className="flex-1 text-xl font-black text-white text-center">New Round</h1>
        <div className="w-9 shrink-0" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Course</label>
          <input
            type="text"
            value={course}
            onChange={e => setCourse(e.target.value)}
            placeholder="e.g. Royal Birkdale"
            className="w-full bg-gray-900 border border-gray-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-green-500 placeholder-gray-700"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Holes</label>
          <div className="flex gap-2">
            {[9, 18].map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setHoles(h)}
                className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                  holes === h
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-900 text-gray-400 border border-gray-700'
                }`}
              >
                {h} holes
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-green-600 text-white font-black text-base rounded-2xl active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-green-900/30"
        >
          {saving ? 'Creating…' : 'Start Round →'}
        </button>
      </form>
    </div>
  )
}
