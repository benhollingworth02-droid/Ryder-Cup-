import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const hasSupabase = !!supabase

// Save or update a round in Supabase
export async function saveRoundRemote(round, adminPinHash) {
  if (!supabase) return { error: 'Supabase not configured' }
  const { error } = await supabase
    .from('rounds')
    .upsert({
      id: round.id,
      data: round,
      admin_pin_hash: adminPinHash,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  return { error }
}

// Load a round by share code
export async function loadRoundRemote(code) {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase
    .from('rounds')
    .select('data, admin_pin_hash')
    .eq('id', code.toUpperCase())
    .single()
  if (error) return { data: null, error }
  return { data: { round: data.data, adminPinHash: data.admin_pin_hash }, error: null }
}

// Subscribe to live updates for a round
export function subscribeToRound(code, onUpdate) {
  if (!supabase) return null
  const channel = supabase
    .channel(`round-${code}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'rounds', filter: `id=eq.${code.toUpperCase()}` },
      payload => {
        if (payload.new?.data) onUpdate(payload.new.data)
      }
    )
    .subscribe()
  return channel
}

export function unsubscribeFromRound(channel) {
  if (supabase && channel) supabase.removeChannel(channel)
}
