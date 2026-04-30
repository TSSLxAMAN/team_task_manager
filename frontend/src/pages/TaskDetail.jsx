import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ArrowLeft, Clock, Calendar, Users, Play, Pause, Check, Undo, ExternalLink, GitBranch } from 'lucide-react'
import { fetchTask, startTask, submitTask, closeTask, reopenTask } from '../store/taskSlice'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { BranchChip } from '../components/BranchChip'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'
import { formatTime, elapsedToDisplay, formatDate, isOverdue } from '../lib/utils'
import { toast } from 'sonner'

export default function TaskDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const nav = useNavigate()
  const user = useSelector((s) => s.auth.user)
  const task = useSelector((s) => s.tasks.current)

  const [timerSec, setTimerSec] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const intervalRef = useRef(null)

  const [showSubmit, setShowSubmit] = useState(false)
  const [showSendBack, setShowSendBack] = useState(false)
  const [mrLink, setMrLink] = useState('')
  const [mrNotes, setMrNotes] = useState('')
  const [sendBackReason, setSendBackReason] = useState('')

  useEffect(() => {
    dispatch(fetchTask(id))
  }, [dispatch, id])

  useEffect(() => {
    if (task) {
      setTimerSec(task.elapsed_seconds || 0)
      if (task.status === 'in_progress') {
        setTimerRunning(true)
      }
      setMrLink(task.mr_link || '')
      setMrNotes(task.completion_notes || '')
    }
  }, [task?.id])

  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => setTimerSec(s => s + 1), 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerRunning])

  const handleStart = async () => {
    const result = await dispatch(startTask(id))
    if (!result.error) {
      setTimerRunning(true)
      toast.info('Timer started', { description: 'Tracking time on this task.' })
    } else {
      toast.error(result.payload?.detail || 'Failed to start task')
    }
  }

  const handleSubmit = async () => {
    if (!mrLink.trim()) { toast.error('MR link is required'); return }
    if (!mrNotes.trim() || mrNotes.length < 10) { toast.error('Please describe what you did (min 10 chars)'); return }
    const result = await dispatch(submitTask({ id, data: { mr_link: mrLink, completion_notes: mrNotes, elapsed_seconds: timerSec } }))
    if (!result.error) {
      setTimerRunning(false)
      setShowSubmit(false)
      toast.success('Submitted for review')
    } else {
      toast.error(result.payload?.detail || 'Submission failed')
    }
  }

  const handleClose = async () => {
    const result = await dispatch(closeTask(id))
    if (!result.error) toast.success(`#${task.task_number} marked done`)
    else toast.error(result.payload?.detail || 'Failed')
  }

  const handleReopen = async () => {
    const result = await dispatch(reopenTask({ id, reason: sendBackReason }))
    if (!result.error) {
      setShowSendBack(false)
      setSendBackReason('')
      toast.warning('Task sent back to assignee')
    } else {
      toast.error(result.payload?.detail || 'Failed')
    }
  }

  if (!task) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading…</div>

  const isAssignee = task.assigned_to === user?.id
  const isAdmin = user?.role === 'admin'
  const isAdminReviewing = isAdmin && task.status === 'under_review'
  const overdue = isOverdue(task.due_date, task.status)

  return (
    <div className="fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button onClick={() => nav(`/projects/${task.project}`)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, padding: '4px 0', cursor: 'pointer', marginBottom: 8 }}>
          <ArrowLeft size={12} /> {task.project_name}
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span className="mono" style={{ color: 'var(--text-faint)', fontSize: 22, fontWeight: 500 }}>#{task.task_number}</span>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{task.title}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Section title="Description">
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{task.description || 'No description.'}</p>
          </Section>

          <Section title="Branch">
            <BranchChip branch={task.branch_name} full />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Check out locally with{' '}
              <span className="mono" style={{ background: 'var(--bg)', padding: '1px 6px', borderRadius: 4 }}>
                git checkout -b {task.branch_name}
              </span>
            </div>
          </Section>

          {task.status === 'sent_back' && task.send_back_reason && (
            <div style={{ padding: 22, background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 10 }}>Sent back by reviewer</div>
              <p style={{ margin: 0, fontSize: 13 }}>{task.send_back_reason}</p>
            </div>
          )}

          {(task.status === 'under_review' || task.status === 'done') && task.mr_link && (
            <Section title="Submission">
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>MR / PR</div>
                <a href={task.mr_link} target="_blank" rel="noreferrer" className="mono" style={{ color: 'var(--info)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {task.mr_link} <ExternalLink size={12} />
                </a>
              </div>
              {task.completion_notes && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>What they did</div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{task.completion_notes}</p>
                </div>
              )}
              {task.elapsed_seconds > 0 && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>Time taken:</span>
                  <span className="mono" style={{ fontWeight: 500 }}>{elapsedToDisplay(task.elapsed_seconds)}</span>
                </div>
              )}
            </Section>
          )}

          <Section title="Assignment">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Assigned by">
                {task.created_by_detail && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={task.created_by_detail.name} size={24} /><span style={{ fontSize: 13 }}>{task.created_by_detail.name}</span></div>}
              </Field>
              <Field label="Assigned to">
                {task.assigned_to_detail && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={task.assigned_to_detail.name} size={24} /><span style={{ fontSize: 13 }}>{task.assigned_to_detail.name}</span></div>}
              </Field>
              <Field label="Project">
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: task.project_color }} />
                  {task.project_name}
                </div>
              </Field>
              <Field label="Created">
                <span style={{ fontSize: 13 }}>{formatDate(task.created_at)}</span>
              </Field>
            </div>
          </Section>
        </div>

        {/* Right: Action panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Status</div>
              <StatusBadge status={task.status} />
            </div>

            {/* Timer — visible to assignee when task is actionable */}
            {isAssignee && ['todo', 'in_progress', 'sent_back'].includes(task.status) && (
              <div style={{
                background: timerRunning ? 'var(--accent-soft)' : 'var(--bg)',
                border: '1px solid ' + (timerRunning ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 12, padding: '20px 18px', marginBottom: 16, transition: 'all 200ms',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Clock size={16} style={{ color: timerRunning ? 'var(--accent)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: 11, color: timerRunning ? 'var(--accent)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                    {timerRunning ? 'Timer running' : timerSec > 0 ? 'Timer paused' : 'Timer ready'}
                  </span>
                  {timerRunning && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s ease-in-out infinite' }} />}
                </div>
                <div className="mono" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '0.02em', color: timerRunning ? 'var(--accent)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
                  {formatTime(timerSec)}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {task.status === 'todo' || task.status === 'sent_back' ? (
                    <button onClick={handleStart} style={{ ...btnPrimary, flex: 1 }}><Play size={12} /> Start work</button>
                  ) : (
                    <button onClick={() => setTimerRunning(r => !r)} style={{ ...btnSecondary, flex: 1 }}>
                      {timerRunning ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: task.status === 'done' ? 0 : 16 }}>
              <MetaRow Icon={Clock} label="Estimated" value={task.estimate_hours ? `${task.estimate_hours} hours` : '—'} />
              <MetaRow Icon={Calendar} label="Due" value={formatDate(task.due_date)} highlight={overdue ? 'var(--danger)' : null} />
              <MetaRow Icon={Users} label="Assignee" value={task.assigned_to_detail?.name || '—'} />
            </div>

            {/* Action buttons */}
            {isAssignee && task.status === 'in_progress' && (
              <button onClick={() => setShowSubmit(true)} style={{ ...btnPrimary, width: '100%', height: 44, fontSize: 14 }}>
                <Check size={14} /> Submit for review
              </button>
            )}

            {isAdminReviewing && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => setShowSendBack(true)} style={btnSecondary}><Undo size={14} /> Send back</button>
                <button onClick={handleClose} style={btnPrimary}><Check size={14} /> Close task</button>
              </div>
            )}

            {task.status === 'done' && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--success-soft)', color: 'var(--success)', borderRadius: 10, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <Check size={15} /> Task completed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit MR Modal */}
      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit for review" footer={<><button onClick={() => setShowSubmit(false)} style={btnSecondary}>Cancel</button><button onClick={handleSubmit} style={btnPrimary}>Submit for review</button></>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={labelStyle}>MR / PR Link *</label><input style={inputStyle} placeholder="https://github.com/org/repo/pull/42" value={mrLink} onChange={e => setMrLink(e.target.value)} autoFocus /></div>
          <div><label style={labelStyle}>What did you do? *</label><textarea style={{ ...inputStyle, height: 100, resize: 'vertical' }} placeholder="Describe what you fixed or built..." value={mrNotes} onChange={e => setMrNotes(e.target.value)} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', padding: '10px 12px', background: 'var(--bg)', borderRadius: 8 }}>
            <Clock size={13} /> Time tracked: <span className="mono" style={{ fontWeight: 500, color: 'var(--text)' }}>{formatTime(timerSec)}</span>
          </div>
        </div>
      </Modal>

      {/* Send Back Modal */}
      <Modal open={showSendBack} onClose={() => setShowSendBack(false)} title="Send back" footer={<><button onClick={() => setShowSendBack(false)} style={btnSecondary}>Cancel</button><button onClick={handleReopen} style={{ ...btnPrimary, background: 'var(--danger)', borderColor: 'var(--danger)' }}>Send back</button></>}>
        <div>
          <label style={labelStyle}>Reason (optional)</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="What needs to be fixed?" value={sendBackReason} onChange={e => setSendBackReason(e.target.value)} autoFocus />
        </div>
      </Modal>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function MetaRow({ Icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
      <Icon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{label}</span>
      <span style={{ fontWeight: 500, color: highlight || 'var(--text)' }}>{value}</span>
    </div>
  )
}

const btnPrimary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const btnSecondary = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6 }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, height: 40, outline: 'none' }
