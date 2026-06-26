import { Badge } from '../ui/Badge'
import type { ProjectStatus, TaskStatus, TaskPriority } from '../../types'

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const map = {
    active:    { variant: 'success', label: 'Active' },
    paused:    { variant: 'warning', label: 'Paused' },
    completed: { variant: 'info',    label: 'Completed' },
    archived:  { variant: 'default', label: 'Archived' },
  } as const
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map = {
    todo:        { variant: 'default', label: 'Todo' },
    in_progress: { variant: 'warning', label: 'In Progress' },
    done:        { variant: 'success', label: 'Done' },
  } as const
  const { variant, label } = map[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map = {
    low:    { variant: 'default', label: '↓ Low' },
    medium: { variant: 'info',    label: '→ Medium' },
    high:   { variant: 'danger',  label: '↑ High' },
  } as const
  const { variant, label } = map[priority]
  return <Badge variant={variant}>{label}</Badge>
}
