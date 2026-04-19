// ─── useFollow hook ────────────────────────────────────────
// Manages follow / unfollow and follower counts.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useFollow(currentUserId, targetUserId) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setLoading(false)
      return
    }
    supabase
      .from('follows')
      .select('id')
      .eq('follower_id',  currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data)
        setLoading(false)
      })
  }, [currentUserId, targetUserId])

  async function toggleFollow() {
    if (!currentUserId || !targetUserId) return
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id',  currentUserId)
        .eq('following_id', targetUserId)
      setIsFollowing(false)
    } else {
      await supabase.from('follows').insert({
        follower_id:  currentUserId,
        following_id: targetUserId,
      })
      setIsFollowing(true)
    }
  }

  return { isFollowing, loading, toggleFollow }
}

export async function getFollowCounts(userId) {
  const [followers, following] = await Promise.all([
    supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
    supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id',  userId),
  ])
  return {
    followers: followers.count || 0,
    following: following.count || 0,
  }
}
