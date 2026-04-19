export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#6e7681', fontSize: 15 }}>
      {message}
    </div>
  )
}
