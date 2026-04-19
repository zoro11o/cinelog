export default function ScoreSelector({ score, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[...Array(10)].map((_, i) => (
        <button key={i} title={`Score ${i + 1}`} onClick={() => onChange && onChange(i + 1 === score ? null : i + 1)}
          style={{ width: 18, height: 18, borderRadius: 3, background: score && i < score ? '#c9a84c' : '#21262d', border: '1px solid #30363d', transition: 'background 0.1s' }} />
      ))}
    </div>
  )
}
