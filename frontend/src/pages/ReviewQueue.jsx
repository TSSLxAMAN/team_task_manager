import { useEffect, useState, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar } from 'lucide-react'
import { fetchReviewQueue } from '../store/taskSlice'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { BranchChip } from '../components/BranchChip'
import { Avatar } from '../components/Avatar'
import { formatDate } from '../lib/utils'

export default function ReviewQueue() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const { reviewQueue: tasks } = useSelector((s) => s.tasks)
  const [selectedProject, setSelectedProject] = useState('all')

  useEffect(() => { dispatch(fetchReviewQueue()) }, [dispatch])

  const projects = useMemo(() => {
    const map = new Map()
    tasks.forEach(t => {
      if (t.project_name && !map.has(t.project_name)) {
        map.set(t.project_name, { name: t.project_name, color: t.project_color })
      }
    })
    return Array.from(map.values())
  }, [tasks])

  const filtered = selectedProject === 'all' ? tasks : tasks.filter(t => t.project_name === selectedProject)

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Review queue</h1>
        <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'task' : 'tasks'} waiting on your review
        </div>
      </div>

      {projects.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            onClick={() => setSelectedProject('all')}
            style={{ padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: selectedProject === 'all' ? 'var(--accent)' : 'var(--card)', color: selectedProject === 'all' ? 'white' : 'var(--text)', transition: 'all 100ms' }}
          >
            All projects
          </button>
          {projects.map(p => (
            <button
              key={p.name}
              onClick={() => setSelectedProject(p.name)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid var(--border)', background: selectedProject === p.name ? 'var(--bg)' : 'var(--card)', color: selectedProject === p.name ? 'var(--text)' : 'var(--text-muted)', outline: selectedProject === p.name ? '2px solid ' + (p.color || 'var(--accent)') : 'none', outlineOffset: -1, transition: 'all 100ms' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.color || 'var(--accent)', flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            {selectedProject === 'all' ? 'All clear — nothing waiting on review.' : `No tasks under review in ${selectedProject}.`}
          </div>
        ) : (
          filtered.map(t => (
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
                  {t.assigned_to_detail && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Avatar name={t.assigned_to_detail.name} size={18} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.assigned_to_detail.name}</span>
                  </div>}
                  {t.due_date && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} /> {formatDate(t.due_date)}
                  </span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StatusBadge status={t.status} />
                <ChevronRight size={14} style={{ color: 'var(--text-faint)' }} />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
