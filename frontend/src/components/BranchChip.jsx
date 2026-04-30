import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function BranchChip({ branch, full = false }) {
  const [copied, setCopied] = useState(false)

  const handle = (e) => {
    e.stopPropagation()
    navigator.clipboard?.writeText(branch).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1400)
  }

  return (
    <button
      onClick={handle}
      className="mono"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: full ? '8px 12px' : '3px 8px',
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: full ? 10 : 6,
        fontSize: full ? 13 : 11, color: 'var(--text-muted)',
        cursor: 'pointer', transition: 'all 120ms',
        maxWidth: full ? '100%' : 220, overflow: 'hidden',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
      title={branch}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{branch}</span>
      {copied
        ? <Check size={full ? 14 : 11} style={{ color: 'var(--success)', flexShrink: 0 }} />
        : <Copy size={full ? 14 : 11} style={{ flexShrink: 0 }} />}
    </button>
  )
}
