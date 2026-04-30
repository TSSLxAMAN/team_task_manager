import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ArrowLeft, Plus, Users, ChevronRight, Calendar } from 'lucide-react'
import { fetchProject } from '../store/projectSlice'
import { fetchProjectTasks, createTask } from '../store/taskSlice'
import { addMember, removeMember } from '../store/projectSlice'
import { ProgressBar } from '../components/ProgressBar'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { BranchChip } from '../components/BranchChip'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'
import { formatDate, isOverdue } from '../lib/utils'
import { toast } from 'sonner'
import api from '../lib/api'

export default function ProjectDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const project = useSelector((s) => s.projects.current)
  const tasks = useSelector((s) => s.tasks.byProject[id] || [])
  const [tab, setTab] = useState('tasks')
  const [showAddTask, setShowAddTask] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assigned_to: '', estimate_hours: 4, due_date: '', parent: '' })
  const [allUsers, setAllUsers] = useState([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')

  useEffect(() => {
    dispatch(fetchProject(id))
    dispatch(fetchProjectTasks(id))
    if (user?.role === 'admin') {
      api.get('/users/').then(r => setAllUsers(r.data)).catch(() => {})
    }
  }, [dispatch, id, user])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return
    const data = { ...taskForm }
    if (!data.assigned_to) delete data.assigned_to
    if (!data.parent) delete data.parent
    if (!data.due_date) delete data.due_date
    const result = await dispatch(createTask({ projectId: id, data }))
    if (!result.error) {
      setShowAddTask(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assigned_to: '', estimate_hours: 4, due_date: '', parent: '' })
      dispatch(fetchProjectTasks(id))
      dispatch(fetchProject(id))
      toast.success('Task created')
    } else {
      toast.error('Failed to create task')
    }
  }

  const handleAddMember = async (email) => {
    const result = await dispatch(addMember({ id, email }))
    if (!result.error) {
      toast.success('Member added')
      dispatch(fetchProject(id))
    } else {
      toast.error(result.payload?.detail || 'Failed')
    }
  }

  const handleRemoveMember = async (userId) => {
    const result = await dispatch(removeMember({ projectId: id, userId }))
    if (!result.error) toast.success('Member removed')
    else toast.error(result.payload?.detail || 'Failed')
  }

  if (!project) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>

  const stats = project.stats || { done: 0, total: 0, review: 0, overdue: 0 }
  const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  const topTasks = tasks.filter(t => !t.parent)
  const members = project.members_detail || []

  const smallStat = (label, value, dot) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => nav('/projects')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 0', cursor: 'pointer', marginBottom: 8 }}>
          <ArrowLeft size={14} /> Projects
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: project.color }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{project.name}</h1>
            </div>
            <div style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 14 }}>{project.description}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowMembers(true)} style={btnSecondary}><Users size={14} /> Members</button>
            {user?.role === 'admin' && <button onClick={() => setShowAddTask(true)} style={btnPrimary}><Plus size={14} /> Add task</button>}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Progress</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stats.done} of {stats.total} tasks complete · {pct}%</div>
        </div>
        <ProgressBar value={stats.done} max={stats.total} color={project.color} />
        <div style={{ display: 'flex', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
          {smallStat('Todo', tasks.filter(t => t.status === 'todo').length, 'var(--text-faint)')}
          {smallStat('In progress', tasks.filter(t => t.status === 'in_progress').length, 'var(--info)')}
          {smallStat('Under review', stats.review, 'var(--warn)')}
          {smallStat('Done', stats.done, 'var(--success)')}
          {stats.overdue > 0 && smallStat('Overdue', stats.overdue, 'var(--danger)')}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {[{ id: 'tasks', label: `Tasks (${tasks.length})` }, { id: 'members', label: `Members (${members.length})` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'), color: tab === t.id ? 'var(--text)' : 'var(--text-muted)', fontWeight: tab === t.id ? 500 : 400, fontSize: 13, cursor: 'pointer', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tasks' ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)' }}>
                {['#', 'Title', 'Branch', 'Priority', 'Assignee', 'Status', 'Due'].map((h, i) => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--border)', width: [48, null, 200, 100, 70, 130, 90][i] }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topTasks.map(t => (
                <>
                  <TaskRow key={t.id} task={t} onClick={() => nav(`/tasks/${t.id}`)} />
                  {(t.subtasks || []).map((sub, i, arr) => (
                    <TaskRow key={sub.id} task={sub} onClick={() => nav(`/tasks/${sub.id}`)} indent isLast={i === arr.length - 1} />
                  ))}
                </>
              ))}
              {topTasks.length === 0 && (
                <tr><td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tasks yet. {user?.role === 'admin' && 'Add the first task.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8, boxShadow: 'var(--shadow-sm)' }}>
          {user?.role === 'admin' && (
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', marginBottom: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowAddMember(true); setMemberSearch('') }} style={btnPrimary}><Plus size={14} /> Add Member</button>
            </div>
          )}
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10 }}>
              <Avatar name={m.name} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 500, textTransform: 'capitalize' }}>{m.role}</span>
              {user?.role === 'admin' && m.id !== project.created_by?.id && (
                <button onClick={() => handleRemoveMember(m.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: 12 }}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <Modal open={showAddTask} onClose={() => setShowAddTask(false)} title="Add task" footer={<><button onClick={() => setShowAddTask(false)} style={btnSecondary}>Cancel</button><button onClick={handleCreateTask} style={btnPrimary}>Create task</button></>}>
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>Title *</label><input style={inputStyle} placeholder="e.g. Fix login regex" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
          <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="What needs to be done?" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Assignee</label>
              <select style={inputStyle} value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Priority</label>
              <select style={inputStyle} value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estimate (hours)</label>
              <input style={inputStyle} type="number" min="1" value={taskForm.estimate_hours} onChange={e => setTaskForm(f => ({ ...f, estimate_hours: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={labelStyle}>Due date</label>
              <input style={inputStyle} type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Parent task (subtask of)</label>
            <select style={inputStyle} value={taskForm.parent} onChange={e => setTaskForm(f => ({ ...f, parent: e.target.value }))}>
              <option value="">None (top-level task)</option>
              {topTasks.map(t => <option key={t.id} value={t.id}>#{t.task_number} {t.title}</option>)}
            </select>
          </div>
          {taskForm.title && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', padding: '10px 12px', borderRadius: 8 }}>
              <span className="mono">Branch: feature/{tasks.length + 1}-{taskForm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'task-name'}</span>
            </div>
          )}
        </form>
      </Modal>

      {/* Members Modal */}
      <Modal open={showMembers} onClose={() => setShowMembers(false)} title={`${project.name} · Members`} footer={<button onClick={() => setShowMembers(false)} style={btnSecondary}>Done</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px', borderRadius: 8 }}>
              <Avatar name={m.name} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.email}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize' }}>{m.role}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member to Project" footer={<button onClick={() => setShowAddMember(false)} style={btnSecondary}>Done</button>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            style={inputStyle}
            placeholder="Search by name or email…"
            value={memberSearch}
            onChange={e => setMemberSearch(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflowY: 'auto' }}>
            {(() => {
              const memberIds = new Set(members.map(m => m.id))
              const filtered = allUsers.filter(u =>
                !memberIds.has(u.id) &&
                (u.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                  u.email?.toLowerCase().includes(memberSearch.toLowerCase()))
              )
              if (filtered.length === 0) {
                return <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  {memberSearch ? 'No users match your search.' : 'All users are already members.'}
                </div>
              }
              return filtered.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 10, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={u.name} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'capitalize', border: '1px solid var(--border)' }}>{u.role}</span>
                  <button
                    onClick={() => handleAddMember(u.email)}
                    style={{ ...btnPrimary, padding: '6px 14px', height: 32, fontSize: 12 }}
                  >
                    Add
                  </button>
                </div>
              ))
            })()}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TaskRow({ task, onClick, indent = false, isLast = false }) {
  const overdue = isOverdue(task.due_date, task.status)
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
    >
      <td style={{ padding: '12px 14px' }}><span className="mono" style={{ color: 'var(--text-faint)', fontSize: 12 }}>#{task.task_number}</span></td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: indent ? 24 : 0, position: 'relative' }}>
          {indent && <span style={{ position: 'absolute', left: 4, top: -10, bottom: isLast ? '50%' : -10, width: 1, background: 'var(--border-strong)' }} />}
          {indent && <span style={{ position: 'absolute', left: 4, top: '50%', width: 14, height: 1, background: 'var(--border-strong)' }} />}
          <span style={{ fontSize: 13, fontWeight: 500 }}>{task.title}</span>
        </div>
      </td>
      <td style={{ padding: '12px 14px' }}>{task.branch_name && <BranchChip branch={task.branch_name} />}</td>
      <td style={{ padding: '12px 14px' }}><PriorityBadge priority={task.priority} /></td>
      <td style={{ padding: '12px 14px' }}>{task.assigned_to_detail && <Avatar name={task.assigned_to_detail.name} size={26} />}</td>
      <td style={{ padding: '12px 14px' }}><StatusBadge status={task.status} /></td>
      <td style={{ padding: '12px 14px' }}><span style={{ fontSize: 12, color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>{formatDate(task.due_date)}</span></td>
    </tr>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const btnSecondary = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, height: 40, outline: 'none' }
