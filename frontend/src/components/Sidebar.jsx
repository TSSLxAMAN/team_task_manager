import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, ListTodo, CheckCircle, LogOut, Network } from 'lucide-react'
import { logout } from '../store/authSlice'
import { Avatar } from './Avatar'

export function Sidebar() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const location = useLocation()
  const user = useSelector((s) => s.auth.user)
  const projects = useSelector((s) => s.projects.list)

  const links = [
    { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', Icon: FolderOpen },
    { to: '/my-tasks', label: 'My Tasks', Icon: ListTodo },
    { to: '/graph', label: 'Task Graph', Icon: Network },
    ...(user?.role === 'admin' ? [{ to: '/review', label: 'Review Queue', Icon: CheckCircle }] : []),
  ]

  const navBtn = (to, label, Icon) => {
    const active = location.pathname === to
    return (
      <button
        key={to}
        onClick={() => nav(to)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', width: '100%', textAlign: 'left',
          background: active ? 'var(--card)' : 'transparent',
          border: '1px solid ' + (active ? 'var(--border)' : 'transparent'),
          color: active ? 'var(--text)' : 'var(--text-muted)',
          fontSize: 13, fontWeight: active ? 500 : 400,
          borderRadius: 8, cursor: 'pointer',
          boxShadow: active ? 'var(--shadow-sm)' : 'none',
          transition: 'all 120ms',
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--card)' }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon size={16} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <aside style={{
      background: 'var(--sidebar)', padding: '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 18,
      overflowY: 'auto', borderRight: '1px solid var(--border)',
      minHeight: '100vh',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src="/TeamFlow.png" alt="TeamFlow logo" className="h-24 w-48 rounded-xl" />
      </div>

      {/* User block */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 10, background: 'var(--card)',
        border: '1px solid var(--border)', borderRadius: 12,
      }}>
        <Avatar name={user?.name} size={36} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: user?.role === 'admin' ? 'var(--accent)' : 'var(--success)' }} />
            {user?.role === 'admin' ? 'Admin' : 'Member'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {links.map(({ to, label, Icon }) => navBtn(to, label, Icon))}
      </nav>

      {/* Project list */}
      {projects.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, padding: '0 10px 8px' }}>
            Your projects
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {projects.map((p) => {
              const active = location.pathname === `/projects/${p.id}`
              return (
                <button
                  key={p.id}
                  onClick={() => nav(`/projects/${p.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', width: '100%', textAlign: 'left',
                    background: active ? 'var(--card)' : 'transparent',
                    border: '1px solid ' + (active ? 'var(--border)' : 'transparent'),
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    fontSize: 13, borderRadius: 8, cursor: 'pointer',
                    fontWeight: active ? 500 : 400,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--card)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />

      <button
        onClick={() => { dispatch(logout()); nav('/login') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', background: 'transparent',
          border: '1px solid transparent', color: 'var(--text-muted)',
          fontSize: 13, borderRadius: 8, cursor: 'pointer',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--card)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <LogOut size={16} />
        <span>Sign out</span>
      </button>
    </aside>
  )
}
