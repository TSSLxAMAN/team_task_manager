import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, ListTodo, CheckCircle, AlertCircle, ChevronRight, Calendar } from 'lucide-react'
import { fetchProjects } from '../store/projectSlice'
import { fetchMyTasks } from '../store/taskSlice'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { BranchChip } from '../components/BranchChip'
import { greet, formatDate, isOverdue } from '../lib/utils'

export default function Dashboard() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const projects = useSelector((s) => s.projects.list)
  const myTasks = useSelector((s) => s.tasks.myTasks)

  useEffect(() => {
    dispatch(fetchProjects())
    dispatch(fetchMyTasks())
  }, [dispatch])

  const reviewCount = myTasks.filter(t => t.status === 'under_review').length
  const overdueCount = myTasks.filter(t => isOverdue(t.due_date, t.status)).length
  const activeTasks = myTasks.filter(t => t.status !== 'done')

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
            {greet(user?.name?.split(' ')[0] || '')}
          </h1>
          <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>
            {activeTasks.length} active tasks
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Projects" value={projects.length} sub="active" accent="#D97706" Icon={FolderOpen} onClick={() => nav('/projects')} />
        <StatCard label="My tasks" value={activeTasks.length} sub="assigned to you" accent="#2563EB" Icon={ListTodo} onClick={() => nav('/my-tasks')} />
        <StatCard
          label={user?.role === 'admin' ? 'Review queue' : 'In review'}
          value={reviewCount}
          sub="waiting"
          accent="#CA8A04"
          Icon={CheckCircle}
          onClick={() => user?.role === 'admin' && nav('/review')}
        />
        <StatCard label="Overdue" value={overdueCount} sub="tasks past due" accent="#DC2626" Icon={AlertCircle} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* My tasks */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>My assigned tasks</div>
            <button onClick={() => nav('/my-tasks')} style={viewAllBtn}>View all <ChevronRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {activeTasks.slice(0, 5).map(t => <TaskRow key={t.id} task={t} onClick={() => nav(`/tasks/${t.id}`)} showProject />)}
            {activeTasks.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>You're all caught up.</div>}
          </div>
        </div>

        {/* Projects overview */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Projects overview</div>
            <button onClick={() => nav('/projects')} style={viewAllBtn}>All projects <ChevronRight size={12} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {projects.slice(0, 5).map(p => <ProjectRow key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />)}
            {projects.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No projects yet.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, accent, Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '18px 18px 16px', textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
        boxShadow: 'var(--shadow-sm)', transition: 'transform 160ms, box-shadow 160ms, border-color 160ms',
      }}
      onMouseEnter={(e) => { if (onClick) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' } }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}1A`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} />
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{sub}</div>
    </button>
  )
}

function TaskRow({ task, onClick, showProject }) {
  const overdue = isOverdue(task.due_date, task.status)
  return (
    <button
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12,
        alignItems: 'center', padding: '12px 14px',
        background: 'transparent', border: 'none', borderRadius: 10,
        textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'background 100ms',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{task.task_number}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
          {showProject && task.project_name && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: task.project_color || 'var(--accent)' }} />
              {task.project_name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {task.branch_name && <BranchChip branch={task.branch_name} />}
          <PriorityBadge priority={task.priority} />
          {task.due_date && (
            <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> {formatDate(task.due_date)}{overdue && ' · Overdue'}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusBadge status={task.status} />
        <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
      </div>
    </button>
  )
}

function ProjectRow({ project, onClick }) {
  const stats = project.stats || { done: 0, total: 0 }
  const allDone = stats.done === stats.total && stats.total > 0
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: 'transparent', border: 'none',
        padding: '12px 14px', borderRadius: 10,
        cursor: 'pointer', transition: 'background 100ms',
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: project.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 500, fontSize: 13 }}>{project.name}</span>
        </div>
        <span style={{ fontSize: 12, color: allDone ? 'var(--success)' : 'var(--text-muted)' }}>
          {allDone ? `${stats.done}/${stats.total} done ✓` : `${stats.done}/${stats.total} tasks`}
        </span>
      </div>
      <ProgressBar value={stats.done} max={stats.total} color={project.color} />
    </button>
  )
}

const viewAllBtn = {
  background: 'none', border: 'none', color: 'var(--text-muted)',
  fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
}
