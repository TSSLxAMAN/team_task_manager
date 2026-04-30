import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatTime(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function elapsedToDisplay(seconds) {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function isOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'done') return false
  return new Date(dueDateStr) < new Date(new Date().toDateString())
}

export function greet(name) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name}`
}

export const STATUS_COLORS = {
  todo:         { bg: 'var(--border)',       fg: 'var(--text-muted)', dot: 'var(--text-faint)' },
  in_progress:  { bg: 'var(--info-soft)',    fg: 'var(--info)',       dot: 'var(--info)' },
  under_review: { bg: 'var(--warn-soft)',    fg: 'var(--warn)',       dot: 'var(--warn)' },
  done:         { bg: 'var(--success-soft)', fg: 'var(--success)',    dot: 'var(--success)' },
  sent_back:    { bg: 'var(--danger-soft)',  fg: 'var(--danger)',     dot: 'var(--danger)' },
}

export const PRIORITY_COLORS = {
  high:   { bg: 'var(--danger-soft)',  fg: 'var(--danger)',  dot: 'var(--danger)' },
  medium: { bg: 'var(--warn-soft)',    fg: 'var(--warn)',    dot: 'var(--warn)' },
  low:    { bg: 'var(--success-soft)', fg: 'var(--success)', dot: 'var(--success)' },
}

export const STATUS_LABELS = {
  todo: 'Todo',
  in_progress: 'In Progress',
  under_review: 'Under Review',
  done: 'Done',
  sent_back: 'Sent Back',
}

export const PROJECT_COLORS = [
  '#D97706', '#2563EB', '#16A34A', '#7C3AED',
  '#DB2777', '#0891B2', '#CA8A04', '#EA580C',
]
