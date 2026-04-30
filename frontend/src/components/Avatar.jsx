const PALETTE = [
  ['#D97706', '#FCD34D'],
  ['#2563EB', '#93C5FD'],
  ['#16A34A', '#86EFAC'],
  ['#7C3AED', '#C4B5FD'],
  ['#DB2777', '#F9A8D4'],
  ['#0891B2', '#67E8F9'],
  ['#CA8A04', '#FDE047'],
  ['#EA580C', '#FDBA74'],
]

function getColors(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const idx = Math.abs(hash) % PALETTE.length
  return PALETTE[idx]
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export function Avatar({ name, size = 32 }) {
  const [c1, c2] = getColors(name || '?')
  return (
    <div
      title={name}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 600,
        color: 'white',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
        flexShrink: 0,
        letterSpacing: '0.02em',
      }}
    >
      {initials(name)}
    </div>
  )
}

export function AvatarStack({ names = [], max = 4, size = 28 }) {
  const visible = names.slice(0, max)
  const extra = names.length - visible.length
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((name, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, boxShadow: `0 0 0 2px var(--card)`, borderRadius: '50%' }}>
          <Avatar name={name} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -8, width: size, height: size,
          borderRadius: '50%', background: 'var(--border)',
          color: 'var(--text-muted)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600,
          boxShadow: `0 0 0 2px var(--card)`,
        }}>+{extra}</div>
      )}
    </div>
  )
}
