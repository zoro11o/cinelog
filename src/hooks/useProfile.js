// ─── useProfile hook ───────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProfile(userId) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setProfile(null); setLoading(false); return }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [userId])

  async function updateProfile(fields) {
    // Use upsert so it works even if the profile row doesn't exist yet
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...fields })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  return { profile, loading, updateProfile }
}
