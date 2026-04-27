// ─── PersonPage ────────────────────────────────────────────
import { useState, useEffect } from 'react'
import { getPersonCredits, TMDB_IMAGE_BASE } from '../lib/tmdb'
import { fetchRatings } from '../hooks/useCommunityRatings'
import AddToListModal from '../components/modals/AddToListModal'
import { STATUS_COLORS, STATUS_LABELS } from '../lib/constants'
import HeartButton from '../components/ui/HeartButton'

const DEPT_ORDER = ['Directing', 'Acting', 'Writing', 'Production', 'Creator', 'Camera', 'Visual Effects', 'Crew']

export default function PersonPage({ personId, onBack, userId, entries, upsertEntry, removeEntry, isFavorite, toggleFavorite }) {
  const [data,             setData]             = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [selected,         setSelected]         = useState(null)
  const [activeTab,        setActiveTab]        = useState(null)
  const [communityRatings, setCommunityRatings] = useState({})

  useEffect(() => {
    setLoading(true)
    setActiveTab(null)
    setData(null)
    getPersonCredits(personId).then(d => {
      setData(d)
      setActiveTab(d.primaryDept)
      setLoading(false)
    })
  }, [personId])

  useEffect(() => {
    if (!data?.departments) return
    const ids = Object.values(data.departments).flat().map(r => String(r.id))
    if (ids.length) fetchRatings(ids).then(setCommunityRatings)
  }, [data])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6e7681' }}>
      Loading…
    </div>
  )

  const person      = data?.person
  const departments = data?.departments || {}
  const knownFor    = data?.knownFor || []
  const primaryDept = data?.primaryDept || 'Acting'

  const deptKeys = Object.keys(departments)
  const orderedTabs = [
    primaryDept,
    ...DEPT_ORDER.filter(d => d !== primaryDept),
    ...deptKeys.filter(d => !DEPT_ORDER.includes(d) && d !== primaryDept),
  ].filter(d => departments[d]?.length > 0)

  const displayCredits = departments[activeTab] || []
  const isActingTab    = activeTab === 'Acting'

  function getExisting(item) {
    return entries?.find(e => String(e.tmdb_id) === String(item.id) && e.media_type === item.media_type)
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <button onClick={onBack} style={{ color: '#6e7681', fontSize: 14, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← Back
      </button>

      {/* ── Person header ── */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'flex-start' }}>
        {person?.profile_path
          ? <img src={`https://image.tmdb.org/t/p/w185${person.profile_path}`} alt={person.name}
              style={{ width: 120, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 120, height: 160, borderRadius: 12, background: '#21262d', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: '#6e7681' }}>
              {person?.name?.[0]}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: '#e6edf3', marginBottom: 10 }}>{person?.name}</h1>
          {person?.known_for_department && (
            <span style={{ fontSize: 13, background: '#22c55e22', color: '#22c55e', borderRadius: 6, padding: '3px 10px', border: '1px solid #22c55e33', display: 'inline-block', marginBottom: 10 }}>
              {person.known_for_department}
            </span>
          )}
          {person?.birthday && (
            <p style={{ fontSize: 13, color: '#6e7681', marginBottom: 6 }}>
              Born {person.birthday}{person.place_of_birth ? ` · ${person.place_of_birth}` : ''}
            </p>
          )}
          {person?.biography && (
            <p style={{ fontSize: 13, color: '#8b949e', lineHeight: 1.7, maxWidth: 620,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8 }}>
              {person.biography}
            </p>
          )}
          <p style={{ fontSize: 13, color: '#6e7681' }}>
            {deptKeys.reduce((sum, d) => sum + (departments[d]?.length || 0), 0)} total credits
          </p>
        </div>
      </div>

      {/* ── Known For strip ── */}
      {knownFor.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Known For
          </h2>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {knownFor.map(item => {
              const title = item.title || item.name
              const yr    = (item.release_date || item.first_air_date || '').slice(0, 4)
              return (
                <div key={`kf-${item.media_type}-${item.id}`}
                  onClick={() => setSelected(item)}
                  style={{ flexShrink: 0, width: 90, cursor: 'pointer', transition: 'opacity 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {item.poster_path
                    ? <img src={`${TMDB_IMAGE_BASE}${item.poster_path}`} alt={title}
                        style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 8, display: 'block', marginBottom: 6 }} />
                    : <div style={{ width: '100%', aspectRatio: '2/3', background: '#21262d', borderRadius: 8, marginBottom: 6 }} />
                  }
                  <div style={{ fontSize: 11, color: '#e6edf3', lineHeight: 1.3 }}>
                    {title?.length > 18 ? title.slice(0, 16) + '…' : title}
                  </div>
                  <div style={{ fontSize: 10, color: '#6e7681', marginTop: 2 }}>{yr}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Department tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #21262d', marginBottom: 24, overflowX: 'auto' }}>
        {orderedTabs.map(dept => (
          <button key={dept} onClick={() => setActiveTab(dept)} style={{
            padding: '10px 18px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            color: activeTab === dept ? '#22c55e' : '#6e7681',
            borderBottom: activeTab === dept ? '2px solid #22c55e' : '2px solid transparent',
            background: 'transparent', border: 'none',
            cursor: 'pointer', marginBottom: -1,
          }}>
            {dept}
            <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6 }}>({departments[dept]?.length || 0})</span>
          </button>
        ))}
      </div>

      {/* ── Credits grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
        {displayCredits.map(item => {
          const existing  = getExisting(item)
          const title     = item.title || item.name
          const yr        = (item.release_date || item.first_air_date || '').slice(0, 4)
          const isFav     = isFavorite?.(item.id, item.media_type)
          const community = communityRatings[String(item.id)]
          const roleLabel = isActingTab ? (item.character || null) : (item.job || activeTab)

          return (
            <div key={`${activeTab}-${item.media_type}-${item.id}`}
              style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, overflow: 'hidden', position: 'relative', transition: 'transform 0.15s, border-color 0.15s', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = '#22c55e55' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#21262d' }}
              onClick={() => setSelected(item)}
            >
              {item.poster_path
                ? <img src={`${TMDB_IMAGE_BASE}${item.poster_path}`} alt={title}
                    style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', aspectRatio: '2/3', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#30363d', fontSize: 11, padding: 8, textAlign: 'center' }}>{title}</div>
              }

              {existing && (
                <div style={{ position: 'absolute', top: 6, left: 6, background: STATUS_COLORS[existing.status], borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: '#fff' }}>
                  {STATUS_LABELS[existing.status].split(' ')[0].toUpperCase()}
                </div>
              )}

              {item.vote_average > 0 && (
                <div style={{ position: 'absolute', top: existing ? 28 : 6, left: 6, background: 'rgba(0,0,0,0.8)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, color: '#f59e0b' }}>
                  ★ {item.vote_average.toFixed(1)}
                </div>
              )}

              {toggleFavorite && (
                <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={e => e.stopPropagation()}>
                  <HeartButton isFav={isFav} onToggle={() => toggleFavorite({ ...item })} size={24} />
                </div>
              )}

              <div style={{ padding: '7px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e6edf3', lineHeight: 1.3, marginBottom: 3 }}>
                  {title.length > 26 ? title.slice(0, 24) + '…' : title}
                </div>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: '#6e7681' }}>{yr}</span>
                  <span style={{ fontSize: 10, background: '#21262d', color: '#8b949e', borderRadius: 3, padding: '1px 5px' }}>
                    {item.media_type === 'movie' ? 'MOVIE' : 'TV'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {community
                    ? <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
                        ♥ {community.avg}<span style={{ color: '#6e7681', fontWeight: 400, fontSize: 10 }}> ({community.count})</span>
                      </span>
                    : <span style={{ fontSize: 10, color: '#30363d' }}>♥ —</span>
                  }
                </div>
                {roleLabel && (
                  <div style={{ fontSize: 11, color: '#6e7681', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {isActingTab ? `as ${roleLabel}` : roleLabel}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <AddToListModal
          item={selected} userId={userId}
          existingEntry={getExisting(selected)}
          onClose={() => setSelected(null)}
          onSave={async payload => { await upsertEntry?.(payload); setSelected(null) }}
          onRemove={async id => { await removeEntry?.(id); setSelected(null) }}
        />
      )}
    </div>
  )
}
