// ─── useCommunityRatings hook ──────────────────────────────
// Fetches aggregated community ratings for a list of titles.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Fetch community rating summary for multiple titles at once
export async function fetchRatings(tmdbIds) {
  if (!tmdbIds?.length) return {}
  const { data } = await supabase
    .from('ratings')
    .select('tmdb_id, score')
    .in('tmdb_id', tmdbIds.map(String))
  if (!data) return {}
  // Aggregate per tmdb_id
  const map = {}
  data.forEach(r => {
    if (!map[r.tmdb_id]) map[r.tmdb_id] = { total: 0, count: 0 }
    map[r.tmdb_id].total += r.score
    map[r.tmdb_id].count++
  })
  const result = {}
  Object.entries(map).forEach(([id, { total, count }]) => {
    result[id] = { avg: (total / count).toFixed(1), count }
  })
  return result
}

// Get a single user's rating for a title
export async function getUserRating(userId, tmdbId, mediaType) {
  if (!userId) return null
  const { data } = await supabase
    .from('ratings')
    .select('score')
    .eq('user_id', userId)
    .eq('tmdb_id', String(tmdbId))
    .eq('media_type', mediaType)
    .maybeSingle()
  return data?.score || null
}

// Submit or update a rating
export async function submitRating(userId, tmdbId, mediaType, score) {
  const { data } = await supabase
    .from('ratings')
    .upsert({ user_id: userId, tmdb_id: String(tmdbId), media_type: mediaType, score },
             { onConflict: 'user_id,tmdb_id,media_type' })
    .select().single()
  return data
}
