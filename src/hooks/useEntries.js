// ─── useEntries hook ───────────────────────────────────────
// Loads and manages all list entries for the logged-in user.
// Handles add, update, and remove from one place.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useEntries(userId) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setEntries([]); setLoading(false); return }
    setLoading(true)
    supabase
      .from('list_entries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        setEntries(data || [])
        setLoading(false)
      })
  }, [userId])

  async function upsertEntry(payload) {
    const { data, error } = await supabase
      .from('list_entries')
      .upsert(
        { ...payload, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,tmdb_id,media_type' }
      )
      .select()
      .single()
    if (error) throw error

    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === data.id)
      if (idx >= 0) { const n = [...prev]; n[idx] = data; return n }
      return [data, ...prev]
    })
    return data
  }

  async function removeEntry(entryId) {
    const { error } = await supabase.from('list_entries').delete().eq('id', entryId)
    if (error) throw error
    setEntries(prev => prev.filter(e => e.id !== entryId))
  }

  return { entries, loading, upsertEntry, removeEntry }
}
