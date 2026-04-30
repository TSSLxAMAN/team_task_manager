import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { fetchProjects, createProject } from '../store/projectSlice'
import { ProgressBar } from '../components/ProgressBar'
import { AvatarStack } from '../components/Avatar'
import { Modal } from '../components/Modal'
import { PROJECT_COLORS } from '../lib/utils'
import { toast } from 'sonner'

export default function Projects() {
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const { list: projects, loading } = useSelector((s) => s.projects)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: PROJECT_COLORS[0] })
  const [creating, setCreating] = useState(false)

  useEffect(() => { dispatch(fetchProjects()) }, [dispatch])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setCreating(true)
    const result = await dispatch(createProject(form))
    setCreating(false)
    if (!result.error) {
      setShowNew(false)
      setForm({ name: '', description: '', color: PROJECT_COLORS[0] })
      toast.success('Project created', { description: `${form.name} is ready for tasks.` })
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Projects</h1>
          <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>{projects.length} projects</div>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setShowNew(true)} style={btnPrimary}>
            <Plus size={14} /> New project
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => nav(`/projects/${p.id}`)} />)}
          {projects.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No projects yet.</div>}
        </div>
      )}

      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New project"
        footer={
          <>
            <button onClick={() => setShowNew(false)} style={btnSecondary}>Cancel</button>
            <button onClick={handleCreate} disabled={creating} style={btnPrimary}>
              {creating ? 'Creating…' : 'Create project'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Project name</label>
            <input style={inputStyle} placeholder="e.g. Mobile Auth" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="What is this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProjectCard({ project, onClick }) {
  const stats = project.stats || { done: 0, total: 0, review: 0, overdue: 0 }
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  const allDone = stats.done === stats.total && stats.total > 0
  const memberNames = (project.members_detail || []).map(m => m.name)

  return (
    <button
      onClick={onClick}
      style={{
        padding: 20, textAlign: 'left', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: 14,
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 14, boxShadow: 'var(--shadow-sm)',
        transition: 'transform 160ms, box-shadow 160ms, border-color 160ms',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: project.color }} />
          <div style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>{project.name}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{project.description}</div>
      </div>

      <div>
        <ProgressBar value={stats.done} max={stats.total} color={project.color} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>{stats.done}/{stats.total} tasks</span>
          <span style={{ color: allDone ? 'var(--success)' : 'var(--text)', fontWeight: 500 }}>
            {allDone ? 'Complete ✓' : `${pct}% complete`}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <AvatarStack names={memberNames} max={4} size={24} />
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {stats.review > 0 && <span style={{ color: 'var(--warn)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warn)' }} />{stats.review} in review</span>}
          {stats.overdue > 0 && <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />{stats.overdue} overdue</span>}
        </div>
      </div>
    </button>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const btnSecondary = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, height: 40, outline: 'none' }
