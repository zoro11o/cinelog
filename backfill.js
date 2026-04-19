// ─── Backfill Script ───────────────────────────────────────
// Fetches missing data from TMDB for all existing list entries.
// Run once: node backfill.js
//
// Fills: genres, original_language, origin_country, release_year,
//        runtime, vote_average, overview, backdrop_path, network
// ───────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config()

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PROXY_URL        = process.env.VITE_PROXY_URL
const TMDB_KEY         = process.env.VITE_TMDB_API_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('\nERROR: Add SUPABASE_SERVICE_ROLE_KEY to your .env file')
  console.error('Get it from: Supabase → Project Settings → API → service_role key\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const sleep    = ms => new Promise(r => setTimeout(r, ms))

async function tmdbFetch(path) {
  try {
    if (PROXY_URL) {
      const res = await fetch(`${PROXY_URL}/api/tmdb?${new URLSearchParams({ path })}`)
      return res.json()
    } else if (TMDB_KEY) {
      const res = await fetch(`https://api.themoviedb.org/3${path}?api_key=${TMDB_KEY}`)
      return res.json()
    }
    throw new Error('No TMDB key or proxy URL in .env')
  } catch { return null }
}

async function backfill() {
  console.log('\nStarting backfill...\n')

  const { data: entries, error } = await supabase
    .from('list_entries')
    .select('*')

  if (error) { console.error('Failed:', error.message); return }
  if (!entries?.length) { console.log('No entries found.'); return }

  // Only process entries missing at least one field
  const needsUpdate = entries.filter(e =>
    !e.original_language || !e.release_year || !e.genres?.length ||
    !e.vote_average || !e.overview || !e.backdrop_path
  )

  console.log(`Total entries:  ${entries.length}`)
  console.log(`Need updating:  ${needsUpdate.length}\n`)

  if (!needsUpdate.length) { console.log('All entries already complete!'); return }

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < needsUpdate.length; i++) {
    const entry = needsUpdate[i]
    process.stdout.write(`[${i+1}/${needsUpdate.length}] ${entry.title.slice(0,40)}... `)

    if (!entry.tmdb_id || isNaN(Number(entry.tmdb_id))) {
      console.log('skipped (not a TMDB ID)')
      skipped++
      continue
    }

    const data = await tmdbFetch(`/${entry.media_type}/${entry.tmdb_id}`)
    if (!data || data.status_code === 34) {
      console.log('not found')
      failed++
      await sleep(250)
      continue
    }

    // Get accurate TV runtime from actual episodes
    let accurateRuntime = entry.runtime
    if (entry.media_type === 'tv' && data.last_episode_to_air?.season_number) {
      try {
        const sNum   = data.last_episode_to_air.season_number
        const season = await tmdbFetch(`/tv/${entry.tmdb_id}/season/${sNum}`)
        const eps    = (season?.episodes || []).filter(e => e.runtime > 0)
        if (eps.length > 0) {
          accurateRuntime = Math.round(eps.reduce((s, e) => s + e.runtime, 0) / eps.length)
        }
        await sleep(150)
      } catch {}
    } else if (entry.media_type === 'movie') {
      accurateRuntime = data.runtime || entry.runtime
    }

    const update = {
      genres:            (data.genres || []).map(g => g.name),
      origin_country:    entry.media_type === 'movie'
        ? (data.production_countries?.[0]?.iso_3166_1 || '')
        : (data.origin_country?.[0] || ''),
      original_language: data.original_language || '',
      release_year:      (data.release_date || data.first_air_date || '').slice(0, 4),
      runtime:           accurateRuntime || entry.runtime,
      vote_average:      data.vote_average || 0,
      overview:          data.overview    || '',
      backdrop_path:     data.backdrop_path || '',
      network:           entry.media_type === 'tv'
        ? (data.networks?.[0]?.name || '')
        : (data.production_companies?.[0]?.name || ''),
    }

    const { error: updateError } = await supabase
      .from('list_entries')
      .update(update)
      .eq('id', entry.id)

    if (updateError) {
      console.log(`FAILED: ${updateError.message}`)
      failed++
    } else {
      console.log(`✓ ${update.original_language} | ${update.release_year} | ★${update.vote_average} | ${update.genres.slice(0,2).join(', ')}`)
      success++
    }

    await sleep(300)
  }

  console.log(`\n✓ Done! ${success} updated, ${skipped} skipped, ${failed} failed.\n`)
}

backfill()
