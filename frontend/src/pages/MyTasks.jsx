import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar } from 'lucide-react'
import { fetchMyTasks } from '../store/taskSlice'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { BranchChip } from '../components/BranchChip'
import { formatDate, isOverdue } from '../lib/utils'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'under_review', label: 'Under review' },
  { id: 'done', label: 'Done' },
]

export default function MyTasks() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { myTasks: tasks } = useSelector((s) => s.tasks)
  const [filter, setFilter] = useState('all')

  useEffect(() => { dispatch(fetchMyTasks()) }, [dispatch])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const counts = { all: tasks.length, todo: 0, in_progress: 0, under_review: 0, done: 0 }
  tasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ })

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>My tasks</h1>
        <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>
          {tasks.length} tasks across {new Set(tasks.map(t => t.project)).size} projects
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8, height: 30, fontSize: 12, fontWeight: 500,
            background: filter === f.id ? 'var(--text)' : 'var(--card)',
            color: filter === f.id ? 'var(--card)' : 'var(--text)',
            border: '1px solid ' + (filter === f.id ? 'var(--text)' : 'var(--border)'),
            cursor: 'pointer',
          }}>
            {f.label} <span style={{ opacity: 0.6 }}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No tasks here.
          </div>
        ) : (
          filtered.map(t => {
            const overdue = isOverdue(t.due_date, t.status)
            return (
              <button
                key={t.id}
                onClick={() => nav(`/tasks/${t.id}`)}
                style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', gap: 12, alignItems: 'center', padding: '12px 14px', background: 'transparent', border: 'none', borderRadius: 10, textAlign: 'left', cursor: 'pointer', width: '100%', transition: 'background 100ms' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{t.task_number}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                    {t.project_name && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.project_color || 'var(--accent)' }} />{t.project_name}
                    </span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {t.branch_name && <BranchChip branch={t.branch_name} />}
                    <PriorityBadge priority={t.priority} />
                    {t.due_date && <span style={{ fontSize: 11, color: overdue ? 'var(--danger)' : 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={11} /> {formatDate(t.due_date)}{overdue && ' · Overdue'}
                    </span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusBadge status={t.status} />
                  <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
