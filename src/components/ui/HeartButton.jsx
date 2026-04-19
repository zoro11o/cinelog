// ─── HeartButton ───────────────────────────────────────────
// Small heart icon to toggle a title as favorite.

export default function HeartButton({ isFav, onToggle, size = 22 }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      style={{
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isFav ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.5)',
        border: `1px solid ${isFav ? '#ef4444' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '50%',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        transition: 'all 0.15s',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill={isFav ? '#ef4444' : 'none'} stroke={isFav ? '#ef4444' : 'rgba(255,255,255,0.7)'} strokeWidth="2.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  )
}
