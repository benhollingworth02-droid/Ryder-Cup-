import { useState } from 'react'
import { createCourse, updateCourse, deleteCourse } from '../lib/supabase'

function defaultHoles(total) {
  return Array.from({ length: total }, (_, i) => ({
    number: i + 1,
    par: 4,
    stroke_index: i + 1,
  }))
}

function HoleEditor({ holes, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex gap-1 px-1 mb-2">
        <div className="w-7 text-[9px] text-gray-600 text-center font-bold">H</div>
        <div className="flex-1 text-[9px] text-gray-600 text-center font-bold">PAR</div>
        <div className="w-14 text-[9px] text-gray-600 text-center font-bold">SI</div>
      </div>
      {holes.map((hole, idx) => (
        <div key={hole.number} className="flex items-center gap-1">
          <div className="w-7 text-xs text-gray-500 text-center font-bold shrink-0">{hole.number}</div>
          <div className="flex-1 flex gap-0.5">
            {[3, 4, 5].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  const next = [...holes]
                  next[idx] = { ...hole, par: p }
                  onChange(next)
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                  hole.par === p
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="18"
            value={hole.stroke_index}
            onChange={e => {
              const v = parseInt(e.target.value, 10)
              if (isNaN(v) || v < 1 || v > 18) return
              const next = [...holes]
              next[idx] = { ...hole, stroke_index: v }
              onChange(next)
            }}
            className="w-14 bg-gray-800 border border-gray-700 text-white text-xs text-center rounded-lg py-1.5 focus:outline-none focus:border-green-500"
          />
        </div>
      ))}
    </div>
  )
}

function CourseCard({ course, onUpdated, onDeleted }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [name, setName]         = useState(course.name)
  const [holes, setHoles]       = useState(
    course.holes?.length ? course.holes : defaultHoles(course.total_holes)
  )
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await updateCourse(course.id, name.trim(), holes.length, holes)
    if (!error && data) onUpdated(data)
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setName(course.name)
    setHoles(course.holes?.length ? course.holes : defaultHoles(course.total_holes))
    setEditing(false)
  }

  async function remove() {
    if (!window.confirm(`Delete "${course.name}"?`)) return
    await deleteCourse(course.id)
    onDeleted(course.id)
  }

  if (editing) {
    return (
      <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 space-y-4">
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-xl px-3 py-3 text-sm border border-gray-600 focus:outline-none focus:border-green-500"
          placeholder="Course name"
        />
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
            Hole Details
          </div>
          <HoleEditor holes={holes} onChange={setHoles} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving…' : '✓ Save'}
          </button>
          <button
            onClick={cancel}
            className="px-4 py-3 bg-gray-700 text-gray-300 rounded-xl text-sm font-bold active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="font-bold text-white text-sm truncate">{course.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {course.total_holes} holes
            {course.holes?.length ? ` · par/SI set` : ' · default par/SI'}
          </div>
        </button>
        <button
          onClick={() => { setExpanded(true); setEditing(true) }}
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

      {expanded && !editing && course.holes?.length > 0 && (
        <div className="border-t border-gray-800 px-4 py-3">
          <div className="flex gap-1 mb-2">
            <div className="w-7 text-[9px] text-gray-600 text-center font-bold">H</div>
            <div className="flex-1 text-[9px] text-gray-600 text-center font-bold">PAR</div>
            <div className="w-10 text-[9px] text-gray-600 text-center font-bold">SI</div>
          </div>
          {course.holes.map(h => (
            <div key={h.number} className="flex items-center gap-1 py-0.5">
              <div className="w-7 text-xs text-gray-500 text-center">{h.number}</div>
              <div className="flex-1 text-xs text-white text-center">{h.par}</div>
              <div className="w-10 text-xs text-gray-400 text-center">{h.stroke_index}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddCourseForm({ onAdded }) {
  const [name, setName]       = useState('')
  const [total, setTotal]     = useState(18)
  const [holes, setHoles]     = useState(defaultHoles(18))
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [showHoles, setShowHoles] = useState(false)

  function handleTotalChange(t) {
    setTotal(t)
    setHoles(defaultHoles(t))
  }

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a course name'); return }
    setSaving(true)
    const { data, error: err } = await createCourse(name.trim(), total, holes)
    if (err) { setError(err.message ?? String(err)); setSaving(false); return }
    onAdded(data)
    setName('')
    setTotal(18)
    setHoles(defaultHoles(18))
    setShowHoles(false)
    setError('')
    setSaving(false)
  }

  return (
    <form onSubmit={submit} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Add Course</div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Course name"
        className="w-full bg-gray-800 text-white rounded-xl px-3 py-3 text-sm border border-gray-700 focus:outline-none focus:border-green-500 placeholder-gray-700"
      />

      <div className="flex gap-2">
        {[9, 18].map(h => (
          <button
            key={h}
            type="button"
            onClick={() => handleTotalChange(h)}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all active:scale-95 ${
              total === h
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {h} holes
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowHoles(s => !s)}
        className="w-full py-2 text-xs text-gray-500 border border-gray-700 rounded-xl active:bg-gray-800"
      >
        {showHoles ? '▲ Hide' : '▼ Set par & stroke index (optional)'}
      </button>

      {showHoles && <HoleEditor holes={holes} onChange={setHoles} />}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 bg-green-600 text-white font-black text-sm rounded-2xl active:scale-95 disabled:opacity-50 transition-all"
      >
        {saving ? 'Adding…' : 'Add Course'}
      </button>
    </form>
  )
}

export default function Courses({ courses, onCoursesChange }) {
  function handleUpdated(updated) {
    onCoursesChange(courses.map(c => c.id === updated.id ? updated : c))
  }

  function handleDeleted(id) {
    onCoursesChange(courses.filter(c => c.id !== id))
  }

  function handleAdded(course) {
    onCoursesChange([...courses, course].sort((a, b) => a.name.localeCompare(b.name)))
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 pb-6">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 -mx-4 px-4 pt-8 pb-6 mb-5 text-center">
        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Golf Scorer</div>
        <h1 className="text-3xl font-black text-white">Courses</h1>
        <p className="text-xs text-gray-600 mt-1.5">Save courses with par & stroke index for accurate scoring</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-10 text-gray-700 text-sm mb-5">
          No courses yet — add your first below
        </div>
      ) : (
        <div className="space-y-2 mb-5">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}

      <AddCourseForm onAdded={handleAdded} />
    </div>
  )
}
