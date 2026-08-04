import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase    = URL && KEY ? createClient(URL, KEY) : null
export const hasSupabase = !!supabase

console.log('[Supabase] init', { url: URL ?? 'NOT SET', keyPresent: !!KEY, clientCreated: hasSupabase })

// ── Players ───────────────────────────────────────────────────────────────────

export async function fetchPlayers() {
  if (!supabase) return { data: [], error: 'Not configured' }
  return supabase.from('players').select('*').order('created_at')
}

export async function createPlayer(name, handicap) {
  if (!supabase) return { data: null, error: 'Not configured' }
  return supabase.from('players').insert({ name, handicap }).select().single()
}

export async function updatePlayer(id, name, handicap) {
  if (!supabase) return { error: 'Not configured' }
  return supabase.from('players').update({ name, handicap }).eq('id', id)
}

export async function deletePlayer(id) {
  if (!supabase) return { error: 'Not configured' }
  return supabase.from('players').delete().eq('id', id)
}

// ── Rounds ────────────────────────────────────────────────────────────────────

export async function fetchRounds() {
  if (!supabase) return { data: [], error: 'Not configured' }
  return supabase.from('rounds').select('*').order('date', { ascending: false })
}

export async function createRound(date, course, holes) {
  if (!supabase) return { data: null, error: 'Not configured' }
  return supabase.from('rounds').insert({ date, course, holes }).select().single()
}

export async function deleteRound(id) {
  if (!supabase) return { error: 'Not configured' }
  return supabase.from('rounds').delete().eq('id', id)
}

// ── Scores ────────────────────────────────────────────────────────────────────

export async function fetchScores(roundId) {
  if (!supabase) return { data: [], error: 'Not configured' }
  return supabase.from('scores').select('*').eq('round_id', roundId)
}

export async function fetchAllScores() {
  if (!supabase) return { data: [], error: 'Not configured' }
  return supabase.from('scores').select('*')
}

export async function upsertScore(roundId, playerId, holeNumber, strokes) {
  if (!supabase) return { error: 'Not configured' }
  return supabase.from('scores').upsert(
    { round_id: roundId, player_id: playerId, hole_number: holeNumber, strokes, updated_at: new Date().toISOString() },
    { onConflict: 'round_id,player_id,hole_number' }
  )
}

export async function deleteScore(roundId, playerId, holeNumber) {
  if (!supabase) return { error: 'Not configured' }
  return supabase.from('scores')
    .delete()
    .eq('round_id', roundId)
    .eq('player_id', playerId)
    .eq('hole_number', holeNumber)
}

// ── Realtime ──────────────────────────────────────────────────────────────────

export function subscribePlayers(callback) {
  if (!supabase) return null
  return supabase.channel('players-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, callback)
    .subscribe()
}

export function subscribeRounds(callback) {
  if (!supabase) return null
  return supabase.channel('rounds-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, callback)
    .subscribe()
}

export function subscribeScores(roundId, callback) {
  if (!supabase) return null
  return supabase.channel(`scores-${roundId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'scores', filter: `round_id=eq.${roundId}` },
      callback)
    .subscribe()
}

export function unsubscribe(channel) {
  if (supabase && channel) supabase.removeChannel(channel)
}
