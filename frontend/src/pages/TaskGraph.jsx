import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Plus, Minus, ChevronDown, RotateCcw } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Modal } from '../components/Modal'
import api from '../lib/api'
import { formatDate } from '../lib/utils'
import { toast } from 'sonner'

// ─── Layout constants ────────────────────────────────────────────────────────
const NODE_W    = 172
const NODE_H    = 90
const V_GAP     = 56   // gap between top-level task rows
const H_GAP     = 24   // horizontal gap between a node and its side children
const SUB_V_GAP = 18   // vertical gap between stacked subtasks
const COL_STEP  = NODE_W + H_GAP   // x-distance per tree level
const SPINE_CX  = 900  // center x of the vertical spine
const PROJ_TOP  = 110
const PROJ_H    = 52
const PROJ_W    = 188

// ─── Status maps ─────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  todo:         '#9CA3AF',
  in_progress:  '#3B82F6',
  under_review: '#F59E0B',
  done:         '#10B981',
  sent_back:    '#EF4444',
}
const STATUS_LABEL = {
  todo:         'TODO',
  in_progress:  'IN PROGRESS',
  under_review: 'UNDER REVIEW',
  done:         'DONE',
  sent_back:    'SENT BACK',
}

// ─── Recursive flatten ───────────────────────────────────────────────────────
// The API nests subtasks inside their parent; we flatten all levels to a single array.
function flattenTasks(list) {
  const out = []
  function walk(task) {
    out.push(task)
    ;(task.subtasks || []).forEach(walk)
  }
  list.forEach(walk)
  return out
}

// ─── Tree layout ─────────────────────────────────────────────────────────────
//
//  Structure:
//   • Top-level tasks (col = 0) sit on the vertical spine.
//   • Their direct children alternate: child[0]→left (col -1), child[1]→right (col +1),
//     child[2]→left (col -1), … — stacked vertically on each side.
//   • Children of a side node (col ≠ 0) stack vertically in the SAME column,
//     connected by short vertical lines — they grow downward from their parent.
//
//  Returns a Map: taskId → { x, y, col, cx, cy }
//   cx / cy = centre of the node (used for connections).

function placeNode(taskId, col, y, allTasks, positions) {
  const cx = SPINE_CX + col * COL_STEP
  positions.set(taskId, {
    x:   cx - NODE_W / 2,
    y,
    col,
    cx,
    cy:  y + NODE_H / 2,
  })

  const children = allTasks.filter(t => t.parent === taskId)
  if (!children.length) return NODE_H

  if (col === 0) {
    // Split children left / right (even-index → left, odd-index → right)
    const leftKids  = children.filter((_, i) => i % 2 === 0)
    const rightKids = children.filter((_, i) => i % 2 === 1)

    let lh = 0, ly = y
    for (const c of leftKids) {
      const h = placeNode(c.id, -1, ly, allTasks, positions)
      ly += h + SUB_V_GAP
      lh += h + SUB_V_GAP
    }
    if (lh > 0) lh -= SUB_V_GAP

    let rh = 0, ry = y
    for (const c of rightKids) {
      const h = placeNode(c.id, 1, ry, allTasks, positions)
      ry += h + SUB_V_GAP
      rh += h + SUB_V_GAP
    }
    if (rh > 0) rh -= SUB_V_GAP

    return Math.max(NODE_H, lh, rh)
  } else {
    // Side node: stack children vertically in the same column
    let total = NODE_H + SUB_V_GAP
    let childY = y + NODE_H + SUB_V_GAP
    for (const c of children) {
      const h = placeNode(c.id, col, childY, allTasks, positions)
      childY += h + SUB_V_GAP
      total  += h + SUB_V_GAP
    }
    return total - SUB_V_GAP
  }
}

function computeLayout(tasks) {
  const positions = new Map()
  const topLevel  = tasks.filter(t => !t.parent)
  let y = PROJ_TOP + PROJ_H + V_GAP

  for (const task of topLevel) {
    const h = placeNode(task.id, 0, y, tasks, positions)
    y += h + V_GAP
  }
  return positions
}

// ─── Build SVG connections ────────────────────────────────────────────────────
//
//  Three connection types:
//   'spine'    – vertical line along the centre spine (project → task, task → task)
//   'branch'   – bezier from spine node edge to side child edge (horizontal-ish)
//   'vertical' – straight line from side node bottom to stacked child top

function buildConnections(visible, positions) {
  const lines = []
  const topLevel = visible.filter(t => !t.parent)

  // Spine segments: project bottom → first task top, then task bottom → next task top
  topLevel.forEach((task, i) => {
    const p = positions.get(task.id)
    if (!p) return
    const prevBottom = i === 0
      ? PROJ_TOP + PROJ_H
      : (positions.get(topLevel[i - 1].id)?.y ?? 0) + NODE_H
    lines.push({ type: 'spine', x1: SPINE_CX, y1: prevBottom, x2: SPINE_CX, y2: p.y })
  })

  // Child connections
  visible.filter(t => t.parent != null).forEach(child => {
    const cp = positions.get(child.id)
    const pp = positions.get(child.parent)
    if (!cp || !pp) return

    if (pp.col === 0) {
      // Horizontal branch from spine node to left / right child
      const goLeft = cp.col < 0
      lines.push({
        type: 'branch',
        x1:   goLeft ? pp.cx - NODE_W / 2 : pp.cx + NODE_W / 2,
        y1:   pp.cy,
        x2:   goLeft ? cp.cx + NODE_W / 2 : cp.cx - NODE_W / 2,
        y2:   cp.cy,
      })
    } else {
      // Vertical connector (same column, child stacked below)
      lines.push({
        type: 'vertical',
        x1: pp.cx, y1: pp.y + NODE_H,
        x2: cp.cx, y2: cp.y,
      })
    }
  })

  return lines
}

// ─── SVG path renderer ───────────────────────────────────────────────────────
function ConnectorPath({ c, i }) {
  if (c.type === 'spine') {
    return (
      <line
        key={i}
        x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
        stroke="var(--border-strong, #C9C7BF)"
        strokeWidth={2}
        strokeLinecap="round"
      />
    )
  }
  if (c.type === 'vertical') {
    return (
      <line
        key={i}
        x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
        stroke="var(--border)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        strokeLinecap="round"
      />
    )
  }
  // 'branch' – S-curve bezier
  const midX = (c.x1 + c.x2) / 2
  return (
    <path
      key={i}
      d={`M${c.x1},${c.y1} C${midX},${c.y1} ${midX},${c.y2} ${c.x2},${c.y2}`}
      fill="none"
      stroke="var(--border-strong, #C9C7BF)"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
const DEFAULT_FORM = { title: '', description: '', priority: 'medium', assigned_to: '', estimate_hours: 4, due_date: '' }

export default function TaskGraph() {
  const nav    = useNavigate()
  const user   = useSelector(s => s.auth.user)
  const isAdmin = user?.role === 'admin'

  const [projects,    setProjects]    = useState([])
  const [selectedId,  setSelectedId]  = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [tasks,       setTasks]       = useState([])
  const [members,     setMembers]     = useState([])
  const [filterStatus,   setFilterStatus]   = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')

  const [zoom, setZoom] = useState(0.72)
  const [pan,  setPan]  = useState({ x: 60, y: 20 })
  const isDragging  = useRef(false)
  const dragOrigin  = useRef({ x: 0, y: 0 })
  const panAtDrag   = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)

  const [showAdd,  setShowAdd]  = useState(false)
  const [addParent, setAddParent] = useState(null)
  const [form, setForm] = useState(DEFAULT_FORM)

  // Load project list once
  useEffect(() => {
    api.get('/projects/').then(r => {
      const list = r.data.results || r.data
      setProjects(list)
      if (list.length) setSelectedId(list[0].id)
    }).catch(() => {})
  }, [])

  const loadProject = useCallback((id) => {
    if (!id) return
    api.get(`/projects/${id}/`).then(r => {
      setProjectData(r.data)
      setMembers(r.data.members_detail || [])
    }).catch(() => {})
    api.get(`/projects/${id}/tasks/`).then(r => {
      setTasks(flattenTasks(r.data))   // recursively flatten all nesting levels
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadProject(selectedId)
    setFilterStatus('all')
    setFilterAssignee('all')
  }, [selectedId, loadProject])

  // Pan
  const onMouseDown = useCallback((e) => {
    if (e.button !== 0 || e.target.closest('.graph-node')) return
    isDragging.current   = true
    dragOrigin.current   = { x: e.clientX, y: e.clientY }
    panAtDrag.current    = { ...pan }
    e.preventDefault()
  }, [pan])

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current) return
    setPan({
      x: panAtDrag.current.x + (e.clientX - dragOrigin.current.x),
      y: panAtDrag.current.y + (e.clientY - dragOrigin.current.y),
    })
  }, [])

  const stopDrag = useCallback(() => { isDragging.current = false }, [])

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = e => {
      e.preventDefault()
      setZoom(z => Math.max(0.2, Math.min(2.5, z * (e.deltaY > 0 ? 0.93 : 1.07))))
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Filter
  const visible = tasks.filter(t => {
    if (filterStatus   !== 'all' && t.status              !== filterStatus)   return false
    if (filterAssignee !== 'all' && String(t.assigned_to) !== filterAssignee) return false
    return true
  })

  const positions   = computeLayout(visible)
  const connections = buildConnections(visible, positions)

  // Canvas bounds
  const allPos  = Array.from(positions.values())
  const minX    = allPos.length ? Math.min(...allPos.map(p => p.x)) - 80  : 0
  const maxX    = allPos.length ? Math.max(...allPos.map(p => p.x + NODE_W)) + 80 : 2200
  const canvasW = Math.max(maxX - minX + 200, 2200)
  const canvasH = allPos.length ? Math.max(900, Math.max(...allPos.map(p => p.y)) + NODE_H + 140) : 900

  // Stats
  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length
  const pct   = total ? Math.round((done / total) * 100) : 0

  const selProj = projects.find(p => p.id === selectedId)

  const openAdd = (parentId) => {
    setAddParent(parentId || null)
    setForm(DEFAULT_FORM)
    setShowAdd(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const data = { ...form }
    if (addParent) data.parent = addParent
    if (!data.assigned_to) delete data.assigned_to
    if (!data.due_date)    delete data.due_date
    try {
      await api.post(`/projects/${selectedId}/tasks/`, data)
      toast.success('Task created')
      setShowAdd(false)
      loadProject(selectedId)
    } catch (err) {
      const msg    = err?.response?.data
      const detail = typeof msg === 'object' ? Object.values(msg).flat().join(' ') : 'Failed to create task'
      toast.error(detail)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── Top bar ── */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>

        {/* Project selector */}
        <div style={{ position: 'relative' }}>
          {selProj && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: '50%', background: selProj.color, pointerEvents: 'none' }} />}
          <select
            value={selectedId || ''}
            onChange={e => setSelectedId(Number(e.target.value))}
            style={{ appearance: 'none', padding: '7px 32px 7px 26px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, fontWeight: 500, cursor: 'pointer', outline: 'none' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
        </div>

        {/* Assignee filter — admin only */}
        {isAdmin && (
          <div style={{ position: 'relative' }}>
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              style={{ appearance: 'none', padding: '7px 28px 7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All assignees</option>
              {members.map(m => <option key={m.id} value={String(m.id)}>{m.name}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
          </div>
        )}

        {/* Status tabs — admin only */}
        {isAdmin && (
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg)', borderRadius: 10, padding: 3, border: '1px solid var(--border)' }}>
            {[
              { key: 'all',          label: 'All'         },
              { key: 'todo',         label: 'Todo'        },
              { key: 'in_progress',  label: 'In progress' },
              { key: 'under_review', label: 'Review'      },
              { key: 'done',         label: 'Done'        },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                style={{ padding: '5px 11px', borderRadius: 8, border: 'none', background: filterStatus === key ? 'var(--card)' : 'transparent', color: filterStatus === key ? 'var(--text)' : 'var(--text-muted)', fontSize: 12, fontWeight: filterStatus === key ? 500 : 400, cursor: 'pointer', boxShadow: filterStatus === key ? 'var(--shadow-sm)' : 'none', whiteSpace: 'nowrap', transition: 'all 100ms' }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.1).toFixed(2)))} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRight: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Minus size={12} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 500, minWidth: 46, textAlign: 'center', color: 'var(--text)' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, +(z + 0.1).toFixed(2)))} style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderLeft: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Plus size={12} />
            </button>
          </div>
          <button
            onClick={() => { setZoom(0.72); setPan({ x: 60, y: 20 }) }}
            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', cursor: 'pointer', color: 'var(--text-muted)' }}
            title="Reset view"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      {projectData && (
        <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--card)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingRight: 14, borderRight: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 1 }}>PROGRESS</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: projectData.color || 'var(--accent)', display: 'inline-block', marginRight: 2 }} />
                <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{pct}%</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{done} / {total} tasks</span>
              </div>
            </div>
          </div>
          {[
            { key: 'todo',         label: 'TODO',         color: STATUS_COLOR.todo         },
            { key: 'in_progress',  label: 'IN PROGRESS',  color: STATUS_COLOR.in_progress  },
            { key: 'under_review', label: 'UNDER REVIEW', color: STATUS_COLOR.under_review },
            { key: 'done',         label: 'DONE',         color: STATUS_COLOR.done         },
            { key: 'sent_back',    label: 'SENT BACK',    color: STATUS_COLOR.sent_back    },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              onClick={() => isAdmin && setFilterStatus(filterStatus === key ? 'all' : key)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px 14px', borderRadius: 10, border: `1px solid ${color}22`, background: `${color}0d`, minWidth: 72, cursor: isAdmin ? 'pointer' : 'default' }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: filterStatus === key ? color : 'var(--text)' }}>{tasks.filter(t => t.status === key).length}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: 'grab', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
      >
        {/* Dot-grid background */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern
              id="tg-dots"
              x={pan.x % (22 * zoom)}
              y={pan.y % (22 * zoom)}
              width={22 * zoom}
              height={22 * zoom}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={1.2} cy={1.2} r={1} fill="var(--border)" opacity={0.7} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tg-dots)" />
        </svg>

        {/* Transformed layer */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0,
            transformOrigin: '0 0',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: canvasW, height: canvasH,
          }}
        >
          {/* Connection lines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: canvasW, height: canvasH, pointerEvents: 'none', overflow: 'visible' }}>
            {connections.map((c, i) => <ConnectorPath key={i} c={c} i={i} />)}
          </svg>

          {/* Project root node */}
          {projectData && (
            <div
              className="graph-node"
              style={{
                position: 'absolute',
                left: SPINE_CX - PROJ_W / 2, top: PROJ_TOP,
                width: PROJ_W, height: PROJ_H,
                background: 'var(--accent)',
                borderRadius: 12,
                padding: '0 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 2px 16px rgba(217,119,6,0.3)',
              }}
            >
              <div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>PROJECT</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 118 }}>{projectData.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.18)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{total} tasks</span>
                {isAdmin && (
                  <button
                    className="graph-node"
                    onClick={e => { e.stopPropagation(); openAdd(null) }}
                    title="Add top-level task"
                    style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Task nodes */}
          {visible.map(task => {
            const p = positions.get(task.id)
            if (!p) return null
            const assignee = members.find(m => m.id === task.assigned_to)
            const color    = STATUS_COLOR[task.status] || '#9CA3AF'
            const label    = STATUS_LABEL[task.status] || task.status
            const isSpine  = p.col === 0

            return (
              <div
                key={task.id}
                className="graph-node"
                onClick={isAdmin ? () => nav(`/tasks/${task.id}`) : undefined}
                style={{
                  position: 'absolute',
                  left: p.x, top: p.y,
                  width: NODE_W, minHeight: NODE_H,
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 10,
                  padding: '9px 11px 9px 10px',
                  cursor: isAdmin ? 'pointer' : 'default',
                  boxShadow: isSpine ? 'var(--shadow-sm)' : '0 1px 4px rgba(0,0,0,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 5,
                  transition: 'box-shadow 120ms, transform 120ms',
                  opacity: isSpine ? 1 : 0.95,
                }}
                onMouseEnter={isAdmin ? (e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.13)'; e.currentTarget.style.transform = 'translateY(-2px)' }) : undefined}
                onMouseLeave={isAdmin ? (e => { e.currentTarget.style.boxShadow = isSpine ? 'var(--shadow-sm)' : '0 1px 4px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = '' }) : undefined}
              >
                {/* #num · status · dot */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: 'monospace', flexShrink: 0 }}>#{task.task_number}</span>
                  <span style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                </div>

                {/* Title */}
                <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text)' }}>
                  {task.title}
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 'auto' }}>
                  {assignee
                    ? <><Avatar name={assignee.name} size={16} /><span style={{ fontSize: 10, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 68 }}>{assignee.name.split(' ')[0]}</span></>
                    : <span style={{ fontSize: 10, color: 'var(--text-faint)' }}>Unassigned</span>
                  }
                  <span style={{ fontSize: 10, color: 'var(--text-faint)', marginLeft: 'auto', flexShrink: 0 }}>{task.due_date ? formatDate(task.due_date) : ''}</span>
                  {isAdmin && (
                    <button
                      className="graph-node"
                      onClick={e => { e.stopPropagation(); openAdd(task.id) }}
                      title="Add subtask"
                      style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, padding: 0 }}
                    >
                      <Plus size={10} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Empty state */}
          {visible.length === 0 && projectData && (
            <div style={{ position: 'absolute', top: '38%', left: SPINE_CX - 140, width: 280, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              {tasks.length === 0 ? 'No tasks in this project yet.' : 'No tasks match the current filter.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Task Modal ── */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title={addParent ? 'Add subtask' : 'Add task'}
        footer={<><button onClick={() => setShowAdd(false)} style={btnSec}>Cancel</button><button onClick={handleCreate} style={btnPri}>Create task</button></>}
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={lbl}>Title *</label>
            <input style={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus />
          </div>
          <div>
            <label style={lbl}>Description</label>
            <textarea style={{ ...inp, height: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What needs to be done?" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Assignee</label>
              <select style={inp} value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                <option value="">Unassigned</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Priority</label>
              <select style={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Estimate (hrs)</label>
              <input style={inp} type="number" min="1" value={form.estimate_hours} onChange={e => setForm(f => ({ ...f, estimate_hours: parseInt(e.target.value) || 0 }))} />
            </div>
            <div>
              <label style={lbl}>Due date</label>
              <input style={inp} type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>
          {form.title && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', padding: '8px 11px', borderRadius: 8 }}>
              <span style={{ fontFamily: 'monospace' }}>Branch: feature/&lt;num&gt;-{form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'task-name'}</span>
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}

const btnPri = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--accent)', color: 'white', border: '1px solid var(--accent)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const btnSec = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 500, cursor: 'pointer', height: 36 }
const lbl = { display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 5 }
const inp = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, height: 38, outline: 'none', boxSizing: 'border-box' }
