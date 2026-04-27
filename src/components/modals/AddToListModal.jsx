// ─── AddToListModal ────────────────────────────────────────

import { useState, useEffect } from 'react'
import { getDetails, getCredits, getSeasons, getRelated, getMedia, TMDB_IMAGE_BASE } from '../../lib/tmdb'
import { submitRating } from '../../hooks/useCommunityRatings'
import { STATUS_LABELS, STATUS_COLORS } from '../../lib/constants'
import ScoreSelector from '../ui/ScoreSelector'
import HeartButton from '../ui/HeartButton'

const inputStyle = { padding: '10px 14px', background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, color: '#e6edf3', fontSize: 14, outline: 'none' }
const labelStyle = { fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, display: 'block' }

const LANGUAGE_NAMES = {
  en:'English', hi:'Hindi', ko:'Korean', ja:'Japanese', es:'Spanish',
  fr:'French', de:'German', zh:'Chinese', ta:'Tamil', te:'Telugu',
  ml:'Malayalam', pt:'Portuguese', it:'Italian', ru:'Russian', tr:'Turkish', ar:'Arabic',
}

function formatRuntime(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function getPosterUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${TMDB_IMAGE_BASE}${path}`
}

export default function AddToListModal({ item, userId, existingEntry, onClose, onSave, onRemove, isFavorite, toggleFavorite }) {
  const [status,        setStatus]        = useState(existingEntry?.status || 'plan_to_watch')
  const [score,         setScore]         = useState(existingEntry?.score || null)
  const [epWatched,     setEpWatched]     = useState(existingEntry?.episodes_watched || 0)
  const [rewatchCount,  setRewatchCount]  = useState(existingEntry?.rewatch_count || 0)
  const [details,       setDetails]       = useState(null)
  const [credits,       setCredits]       = useState(null)
  const [seasons,       setSeasons]       = useState([])
  const [related,       setRelated]       = useState([])
  const [relatedCollection, setRelatedCollection] = useState(null)
  const [media,         setMedia]         = useState(null)
  const [mediaLoading,  setMediaLoading]  = useState(false)
  const [activeMediaTab, setActiveMediaTab] = useState('videos')
  const [saving,        setSaving]        = useState(false)
  const [tab,           setTab]           = useState('info')

  const type   = item.media_type || 'movie'
  const title  = item.title || item.name
  const tmdbId = item.tmdb_id || item.id
  const poster = item.poster_path || existingEntry?.poster_path || null
  const isFav  = isFavorite?.(tmdbId, type) || false

  useEffect(() => {
    getDetails(tmdbId, type).then(setDetails).catch(() => {})
    getCredits(tmdbId, type).then(setCredits).catch(() => {})
    getRelated(tmdbId, type).then(r => {
      setRelated(r?.parts || [])
      setRelatedCollection(r?.collectionName || null)
    }).catch(() => {})
    if (type === 'tv') getSeasons(tmdbId).then(setSeasons).catch(() => {})
  }, [tmdbId, type])

  function handleTabChange(newTab) {
    setTab(newTab)
    if (newTab === 'media' && !media && !mediaLoading) {
      setMediaLoading(true)
      getMedia(tmdbId, type)
        .then(data => { setMedia(data); setMediaLoading(false) })
        .catch(() => setMediaLoading(false))
    }
  }

  const runtime     = type === 'movie'
    ? (details?.runtime || 90)
    : (details?._accurate_runtime || details?.episode_run_time?.[0] || details?.episode_run_time || 24)
  const totalEp     = details?.number_of_episodes || existingEntry?.total_episodes || 0
  const genres      = details?.genres?.map(g => g.name) || []
  const country     = type === 'movie'
    ? (details?.production_countries?.[0]?.iso_3166_1 || '')
    : (details?.origin_country?.[0] || '')
  const language    = details?.original_language || ''
  const releaseYear = (details?.release_date || details?.first_air_date || '').slice(0, 4)
  const overview    = details?.overview || ''
  const voteAvg     = details?.vote_average?.toFixed(1)
  const cast        = (credits?.cast || []).slice(0, 15)
  const director    = (credits?.crew || []).find(c => c.job === 'Director')
  const posterUrl   = getPosterUrl(poster)

  async function handleSave() {
    setSaving(true)
    const corePayload = {
      user_id:           userId,
      tmdb_id:           String(tmdbId),
      media_type:        type,
      title,
      poster_path:       poster || '',
      status,
      score,
      episodes_watched:  type === 'tv' ? epWatched : (existingEntry?.episodes_watched || 1),
      total_episodes:    type === 'tv' ? (totalEp || existingEntry?.total_episodes || 1) : (existingEntry?.total_episodes || 1),
      runtime,
      genres,
      origin_country:    country    || existingEntry?.origin_country    || '',
      original_language: language   || existingEntry?.original_language || '',
      release_year:      releaseYear || existingEntry?.release_year     || '',
    }
    try {
      await onSave({
        ...corePayload,
        vote_average:  details?.vote_average  || existingEntry?.vote_average  || 0,
        overview:      details?.overview      || existingEntry?.overview      || '',
        backdrop_path: details?.backdrop_path || existingEntry?.backdrop_path || '',
        rewatch_count: rewatchCount,
      })
    } catch {
      try { await onSave(corePayload) } catch (err2) { console.error('Save failed:', err2) }
    }
    if (score && userId) {
      try { await submitRating(userId, String(tmdbId), type, score) } catch {}
    }
    setSaving(false)
  }

  async function handleRemove() {
    if (!existingEntry) return
    setSaving(true)
    try { await onRemove(existingEntry.id) } finally { setSaving(false) }
  }

  const tabs = [
    { id: 'info',    label: 'Info' },
    { id: 'cast',    label: `Cast${cast.length ? ` (${cast.length})` : ''}` },
    ...(type === 'tv' ? [{ id: 'seasons', label: `Seasons${seasons.length ? ` (${seasons.length})` : ''}` }] : []),
    { id: 'media',   label: 'Media' },
    { id: 'related', label: 'Related' },
  ]

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>

        {/* ── Hero header ── */}
        <div style={{ position: 'relative', borderRadius: '14px 14px 0 0', overflow: 'hidden', flexShrink: 0 }}>
          {posterUrl && (
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${posterUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.3)', transform: 'scale(1.1)' }} />
          )}
          {!posterUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a2332, #0d1117)' }} />}

          {/* Heart button — top right of hero */}
          {toggleFavorite && (
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} onClick={e => e.stopPropagation()}>
              <HeartButton isFav={isFav} onToggle={() => toggleFavorite({ ...item, id: tmdbId, media_type: type, title, poster_path: poster })} size={28} />
            </div>
          )}

          <div style={{ position: 'relative', display: 'flex', gap: 16, padding: 20 }}>
            {posterUrl
              ? <img src={posterUrl} alt={title} style={{ width: 90, borderRadius: 8, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
              : <div style={{ width: 90, minHeight: 130, borderRadius: 8, background: '#21262d', flexShrink: 0 }} />
            }
            <div style={{ flex: 1, minWidth: 0, paddingRight: toggleFavorite ? 32 : 0 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 6, lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{title}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
                  {type === 'movie' ? 'MOVIE' : 'TV SHOW'}
                </span>
                {releaseYear && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 4, padding: '2px 8px' }}>{releaseYear}</span>}
                {LANGUAGE_NAMES[language] && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.1)', color: '#ddd', borderRadius: 4, padding: '2px 8px' }}>{LANGUAGE_NAMES[language]}</span>}
                {voteAvg && <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.3)', color: '#f59e0b', borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>★ {voteAvg}</span>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                {genres.slice(0, 4).map(g => (
                  <span key={g} style={{ fontSize: 11, background: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 4, padding: '2px 8px', border: '1px solid rgba(34,197,94,0.25)' }}>{g}</span>
                ))}
              </div>
              {details ? (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                  {type === 'movie'
                    ? formatRuntime(runtime)
                    : `${totalEp} eps · ${formatRuntime(runtime)} each`}
                  {director && (
                    <> · Dir. <span
                      onClick={() => { onClose(); setTimeout(() => window._watchvault_open_person?.(director.id), 100) }}
                      style={{ color: '#22c55e', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                    >{director.name}</span></>
                  )}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading details…</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #21262d', flexShrink: 0, overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
              padding: '10px 16px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
              color: tab === t.id ? '#22c55e' : '#6e7681',
              borderBottom: tab === t.id ? '2px solid #22c55e' : '2px solid transparent',
              background: 'transparent', border: 'none', marginBottom: -1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>

          {/* INFO TAB */}
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {overview && <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7 }}>{overview}</p>}

              <div>
                <label style={labelStyle}>Status</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <button key={k} onClick={() => setStatus(k)} style={{
                      padding: '6px 12px', borderRadius: 6, fontSize: 13,
                      border: `1px solid ${status === k ? STATUS_COLORS[k] : '#21262d'}`,
                      background: status === k ? STATUS_COLORS[k] + '22' : 'transparent',
                      color: status === k ? STATUS_COLORS[k] : '#8b949e',
                      fontWeight: status === k ? 600 : 400,
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Score ({score || '—'}/10)</label>
                <ScoreSelector score={score} onChange={setScore} />
              </div>

              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Rewatched</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => setRewatchCount(c => Math.max(0, c - 1))}
                    style={{ width: 32, height: 32, borderRadius: 6, background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <div style={{ minWidth: 80, textAlign: 'center' }}>
                    <span style={{ fontSize: 20, fontWeight: 600, color: rewatchCount > 0 ? '#22c55e' : '#6e7681' }}>{rewatchCount}</span>
                    <span style={{ fontSize: 12, color: '#6e7681', marginLeft: 4 }}>{rewatchCount === 1 ? 'time' : 'times'}</span>
                  </div>
                  <button onClick={() => setRewatchCount(c => c + 1)}
                    style={{ width: 32, height: 32, borderRadius: 6, background: '#21262d', border: '1px solid #30363d', color: '#e6edf3', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                </div>
                {rewatchCount > 0 && <p style={{ fontSize: 11, color: '#6e7681', marginTop: 5 }}>Time counted ×{rewatchCount + 1} in your stats</p>}
              </div>

              {type === 'tv' && (
                <div>
                  <label style={labelStyle}>Episodes Watched ({epWatched} / {totalEp || '?'})</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="range" min={0} max={totalEp || 999} value={epWatched}
                      onChange={e => setEpWatched(Number(e.target.value))} style={{ flex: 1 }} />
                    <input type="number" min={0} max={totalEp || 9999} value={epWatched}
                      onChange={e => setEpWatched(Number(e.target.value))}
                      style={{ ...inputStyle, width: 64, textAlign: 'center', padding: '6px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: 11, borderRadius: 8, background: '#22c55e', color: '#0d1117', fontWeight: 600, fontSize: 14, opacity: saving ? 0.7 : 1, border: 'none', cursor: saving ? 'default' : 'pointer' }}>
                  {saving ? 'Saving…' : existingEntry ? 'Update' : 'Add to List'}
                </button>
                {existingEntry && (
                  <button onClick={handleRemove} disabled={saving} style={{ padding: '11px 16px', borderRadius: 8, border: '1px solid #ef444455', color: '#f87171', fontSize: 14, background: 'transparent', cursor: 'pointer' }}>
                    Remove
                  </button>
                )}
                <button onClick={onClose} style={{ padding: '11px 16px', borderRadius: 8, border: '1px solid #21262d', color: '#6e7681', fontSize: 14, background: 'transparent', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* CAST TAB */}
          {tab === 'cast' && (() => {
            const PROMO_KEYWORDS = ['himself', 'herself', 'themselves', ' self', 'host', 'archive footage', 'interview', 'special appearance', 'presenter']
            const isPromo = c => { const ch = (c.character || '').toLowerCase(); return PROMO_KEYWORDS.some(k => ch.includes(k)) }
            const mainCast  = cast.filter(c => !isPromo(c))
            const promoCast = cast.filter(c => isPromo(c))
            const CastRow = ({ person }) => (
              <div onClick={() => { onClose(); setTimeout(() => window._watchvault_open_person?.(person.id), 100) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '6px 8px', borderRadius: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {person.profile_path
                  ? <img src={`${TMDB_IMAGE_BASE}${person.profile_path}`} alt={person.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#21262d', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6e7681' }}>{person.name[0]}</div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#e6edf3' }}>{person.name}</div>
                  <div style={{ fontSize: 12, color: '#6e7681', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.character || 'Appearance'}</div>
                </div>
                <div style={{ fontSize: 11, color: '#22c55e', flexShrink: 0 }}>View →</div>
              </div>
            )
            return (
              <div>
                {!credits && <p style={{ color: '#6e7681', fontSize: 14 }}>Loading cast…</p>}
                {credits && cast.length === 0 && <p style={{ color: '#6e7681', fontSize: 14 }}>No cast info available.</p>}
                {mainCast.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>{mainCast.map(p => <CastRow key={p.id} person={p} />)}</div>}
                {promoCast.length > 0 && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontSize: 12, color: '#6e7681', cursor: 'pointer', marginBottom: 8, userSelect: 'none' }}>Promos / Appearances ({promoCast.length})</summary>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{promoCast.map(p => <CastRow key={p.id} person={p} />)}</div>
                  </details>
                )}
              </div>
            )
          })()}

          {/* SEASONS TAB */}
          {tab === 'seasons' && type === 'tv' && (
            <div>
              {seasons.length === 0 && <p style={{ color: '#6e7681', fontSize: 14 }}>Loading seasons…</p>}
              <p style={{ fontSize: 12, color: '#6e7681', marginBottom: 12 }}>Click any season to set your episode count to the end of that season.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {seasons.map((s, idx) => {
                  const cumulativeEps = seasons.filter(sx => sx.season_number <= s.season_number).reduce((sum, sx) => sum + (sx.episode_count || 0), 0)
                  const isCurrentSeason = epWatched >= (idx > 0 ? seasons.filter(sx => sx.season_number < s.season_number).reduce((sum, sx) => sum + (sx.episode_count || 0), 0) : 0) && epWatched <= cumulativeEps
                  return (
                    <div key={s.id} onClick={() => setEpWatched(cumulativeEps)}
                      style={{ display: 'flex', gap: 12, background: '#0d1117', borderRadius: 8, padding: 10, cursor: 'pointer', border: `1px solid ${isCurrentSeason ? '#22c55e44' : 'transparent'}`, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#22c55e44'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = isCurrentSeason ? '#22c55e44' : 'transparent'}
                    >
                      {s.poster_path
                        ? <img src={`${TMDB_IMAGE_BASE}${s.poster_path}`} alt={s.name} style={{ width: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0, alignSelf: 'flex-start' }} />
                        : <div style={{ width: 48, minHeight: 64, borderRadius: 6, background: '#21262d', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#e6edf3', marginBottom: 2 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: '#6e7681', marginBottom: 4 }}>
                          {s.episode_count} eps{s.air_date ? ` · ${s.air_date.slice(0, 4)}` : ''} · <span style={{ color: '#8b949e' }}>cumulative: {cumulativeEps} eps</span>
                        </div>
                        {s.overview && <p style={{ fontSize: 12, color: '#6e7681', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.overview}</p>}
                      </div>
                      <div style={{ fontSize: 11, color: '#22c55e', alignSelf: 'center', flexShrink: 0, whiteSpace: 'nowrap', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '4px 10px', fontWeight: 600 }}>
                        ✓ {cumulativeEps} eps
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* MEDIA TAB */}
          {tab === 'media' && (
            <div>
              {mediaLoading && <div style={{ textAlign: 'center', padding: '48px 0', color: '#6e7681' }}><p>Loading media…</p></div>}
              {!mediaLoading && media && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {[
                      { key: 'videos',    label: 'Videos',    count: media.videos.length },
                      { key: 'backdrops', label: 'Backdrops', count: media.backdrops.length },
                      { key: 'posters',   label: 'Posters',   count: media.posters.length },
                    ].map(({ key, label, count }) => (
                      <button key={key} onClick={() => setActiveMediaTab(key)} style={{
                        padding: '6px 14px', borderRadius: 20, border: '1px solid',
                        borderColor: activeMediaTab === key ? '#22c55e' : '#21262d',
                        cursor: 'pointer', fontSize: 12, fontWeight: activeMediaTab === key ? 600 : 400,
                        background: activeMediaTab === key ? 'rgba(34,197,94,0.12)' : 'transparent',
                        color: activeMediaTab === key ? '#22c55e' : '#6e7681',
                      }}>
                        {label} <span style={{ opacity: 0.7, fontSize: 11 }}>({count})</span>
                      </button>
                    ))}
                  </div>

                  {activeMediaTab === 'videos' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {media.videos.length === 0 && <p style={{ color: '#6e7681', textAlign: 'center', padding: '32px 0' }}>No videos available.</p>}
                      {media.videos.map(v => (
                        <div key={v.key} style={{ borderRadius: 10, overflow: 'hidden', background: '#0d1117', border: '1px solid #21262d' }}>
                          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                            <iframe src={`https://www.youtube.com/embed/${v.key}`} title={v.name} allowFullScreen
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                          </div>
                          <div style={{ padding: '10px 14px' }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#e6edf3' }}>{v.name}</p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6e7681' }}>{v.type}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeMediaTab === 'backdrops' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                      {media.backdrops.length === 0 && <p style={{ color: '#6e7681', padding: '32px 0', gridColumn: '1/-1', textAlign: 'center' }}>No backdrops available.</p>}
                      {media.backdrops.map((img, i) => (
                        <a key={i} href={`https://image.tmdb.org/t/p/original${img.file_path}`} target="_blank" rel="noreferrer"
                          style={{ display: 'block', borderRadius: 7, overflow: 'hidden', border: '1px solid #21262d' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <img src={`https://image.tmdb.org/t/p/w500${img.file_path}`} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
                        </a>
                      ))}
                    </div>
                  )}

                  {activeMediaTab === 'posters' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                      {media.posters.length === 0 && <p style={{ color: '#6e7681', padding: '32px 0', gridColumn: '1/-1', textAlign: 'center' }}>No posters available.</p>}
                      {media.posters.map((img, i) => (
                        <a key={i} href={`https://image.tmdb.org/t/p/original${img.file_path}`} target="_blank" rel="noreferrer"
                          style={{ display: 'block', borderRadius: 7, overflow: 'hidden', border: '1px solid #21262d' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <img src={`https://image.tmdb.org/t/p/w300${img.file_path}`} alt="" style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* RELATED TAB */}
          {tab === 'related' && (
            <div>
              {!details && <p style={{ color: '#6e7681', fontSize: 14 }}>Loading…</p>}
              {details && related.length === 0 && !relatedCollection && (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6e7681' }}>
                  <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>⟡</div>
                  <p style={{ fontSize: 14 }}>No franchise connections found.</p>
                  <p style={{ fontSize: 12, marginTop: 6 }}>This title isn't part of a known collection.</p>
                </div>
              )}
              {related.length > 0 && (
                <>
                  {relatedCollection && <p style={{ fontSize: 13, color: '#22c55e', marginBottom: 14, fontWeight: 500 }}>Part of: {relatedCollection}</p>}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
                    {related.map(r => {
                      const t       = r.title || r.name
                      const yr      = (r.release_date || r.first_air_date || '').slice(0, 4)
                      const rType   = r.media_type || 'movie'
                      const curDate = details?.release_date || details?.first_air_date || ''
                      const rDate   = r.release_date || r.first_air_date || ''
                      const relation = rDate < curDate ? 'Prequel' : 'Sequel'
                      return (
                        <div key={r.id}
                          onClick={() => { onClose(); setTimeout(() => window._watchvault_open_item?.({ ...r, media_type: rType }), 100) }}
                          style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          {r.poster_path
                            ? <img src={`${TMDB_IMAGE_BASE}${r.poster_path}`} alt={t} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 7, display: 'block', marginBottom: 6 }} />
                            : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 7, marginBottom: 6 }} />
                          }
                          <div style={{ fontSize: 11, color: '#e6edf3', lineHeight: 1.3, marginBottom: 2 }}>{t?.length > 20 ? t.slice(0, 18) + '…' : t}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: '#6e7681' }}>{yr}</span>
                            <span style={{ fontSize: 9, color: rDate < curDate ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>{relation}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
