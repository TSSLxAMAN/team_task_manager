import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../lib/utils'

export function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.todo
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.fg,
      fontSize: 11, fontWeight: 500, height: 22,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.low
  const label = { high: 'High', medium: 'Medium', low: 'Low' }[priority]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.fg,
      fontSize: 11, fontWeight: 500, height: 22,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}
