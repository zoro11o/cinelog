// ─── useFavorites hook ─────────────────────────────────────

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFavorites(userId) {
  const [favorites, setFavorites] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!userId) { setFavorites([]); setLoading(false); return }
    supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { setFavorites(data || []); setLoading(false) })
  }, [userId])

  async function toggleFavorite(item) {
    const existing = favorites.find(
      f => f.tmdb_id === String(item.tmdb_id || item.id) && f.media_type === item.media_type
    )
    if (existing) {
      await supabase.from('favorites').delete().eq('id', existing.id)
      setFavorites(prev => prev.filter(f => f.id !== existing.id))
    } else {
      const maxOrder = favorites.length > 0 ? Math.max(...favorites.map(f => f.sort_order)) + 1 : 0
      const { data } = await supabase.from('favorites').insert({
        user_id:    userId,
        tmdb_id:    String(item.tmdb_id || item.id),
        media_type: item.media_type,
        title:      item.title || item.name,
        poster_path: item.poster_path || '',
        sort_order:  maxOrder,
      }).select().single()
      if (data) setFavorites(prev => [...prev, data])
    }
  }

  function isFavorite(tmdbId, mediaType) {
    return favorites.some(f => f.tmdb_id === String(tmdbId) && f.media_type === mediaType)
  }

  async function reorderFavorites(newOrder) {
    // newOrder is array of {id, sort_order}
    setFavorites(prev => {
      const updated = [...prev]
      newOrder.forEach(({ id, sort_order }) => {
        const idx = updated.findIndex(f => f.id === id)
        if (idx >= 0) updated[idx] = { ...updated[idx], sort_order }
      })
      return updated.sort((a, b) => a.sort_order - b.sort_order)
    })
    // Batch update in Supabase
    for (const { id, sort_order } of newOrder) {
      await supabase.from('favorites').update({ sort_order }).eq('id', id)
    }
  }

  return { favorites, loading, toggleFavorite, isFavorite, reorderFavorites }
}
