import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Toaster } from 'sonner'
import { fetchMe } from './store/authSlice'
import { fetchProjects } from './store/projectSlice'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import TaskDetail from './pages/TaskDetail'
import MyTasks from './pages/MyTasks'
import ReviewQueue from './pages/ReviewQueue'
import TaskGraph from './pages/TaskGraph'

function AppShell({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ overflowY: 'auto', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '14px 40px 0', maxWidth: 1200, margin: '0 auto' }}>
          <ThemeToggle />
        </div>
        {children}
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth)
  if (!initialized) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <AppShell>{children}</AppShell>
}

function ProtectedFullRoute({ children }) {
  const { user, initialized } = useSelector((s) => s.auth)
  if (!initialized) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {children}
      </div>
    </div>
  )
}

function AdminRoute({ children }) {
  const user = useSelector((s) => s.auth.user)
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const dispatch = useDispatch()
  const user = useSelector((s) => s.auth.user)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) dispatch(fetchMe())
    else dispatch({ type: 'auth/fetchMe/rejected' })
  }, [dispatch])

  useEffect(() => {
    if (user) dispatch(fetchProjects())
  }, [user, dispatch])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
      <Route path="/my-tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
      <Route path="/review" element={<ProtectedRoute><AdminRoute><ReviewQueue /></AdminRoute></ProtectedRoute>} />
      <Route path="/graph" element={<ProtectedFullRoute><TaskGraph /></ProtectedFullRoute>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  )
}
