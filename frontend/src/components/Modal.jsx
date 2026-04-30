import { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ open, onClose, title, children, footer, width = 480 }) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20,20,20,0.5)',
        backdropFilter: 'blur(2px)',
        zIndex: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 160ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, boxShadow: 'var(--shadow-lg)',
          width, maxWidth: 'calc(100vw - 40px)',
          maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
          animation: 'scaleIn 200ms cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer',
              padding: 4, borderRadius: 6, display: 'flex',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 8,
            background: 'var(--bg)',
            borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
