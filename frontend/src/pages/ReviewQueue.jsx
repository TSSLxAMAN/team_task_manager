import { useEffect } from 'react'
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

  useEffect(() => { dispatch(fetchReviewQueue()) }, [dispatch])

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Review queue</h1>
        <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} waiting on your review
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            All clear — nothing waiting on review.
          </div>
        ) : (
          tasks.map(t => (
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
