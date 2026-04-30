import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <button
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
      title="Toggle theme"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--card)', border: '1px solid var(--border)',
        color: 'var(--text-muted)', cursor: 'pointer',
        transition: 'all 120ms',
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
