export function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: color || 'var(--accent)',
        borderRadius: 999,
        transition: 'width 320ms cubic-bezier(.2,.7,.2,1)',
      }} />
    </div>
  )
}
