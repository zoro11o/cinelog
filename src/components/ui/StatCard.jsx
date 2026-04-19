export default function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '18px 20px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: accent || '#e6edf3', fontFamily: "'DM Serif Display', serif" }}>{value}</div>
    </div>
  )
}
