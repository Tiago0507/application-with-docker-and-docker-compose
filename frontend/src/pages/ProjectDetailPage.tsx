import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react'
import { useProject } from '../hooks/useProjects'
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ProjectStatusBadge, TaskStatusBadge, PriorityBadge } from '../components/shared/StatusBadge'
import { ProgressBar } from '../components/shared/ProgressBar'
import type { Task, TaskStatus, TaskPriority } from '../types'

function CreateTaskModal({
  open, onClose, projectId,
}: { open: boolean; onClose: () => void; projectId: number }) {
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const create = useCreateTask(projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await create.mutateAsync({ title: title.trim(), description: desc.trim() || undefined, priority })
    setTitle(''); setDesc(''); setPriority('medium')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Title *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-lg border border-slate-600 bg-surface-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={2}
            placeholder="Optional description"
            className="w-full resize-none rounded-lg border border-slate-600 bg-surface-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Priority</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as TaskPriority[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${
                  priority === p
                    ? 'border-brand-500 bg-brand-500/15 text-brand-400'
                    : 'border-slate-600 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending} disabled={!title.trim()}>
            Add Task
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function TaskStatusIcon({ status }: { status: TaskStatus }) {
  if (status === 'done') return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
  if (status === 'in_progress') return <Clock className="h-4 w-4 text-amber-400" />
  return <Circle className="h-4 w-4 text-slate-600" />
}

function TaskRow({ task, projectId }: { task: Task; projectId: number }) {
  const update = useUpdateTask(projectId)
  const remove = useDeleteTask(projectId)

  const cycleStatus = () => {
    const next: Record<TaskStatus, TaskStatus> = {
      todo: 'in_progress', in_progress: 'done', done: 'todo',
    }
    update.mutate({ id: task.id, status: next[task.status] })
  }

  return (
    <li className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-700">
      <button
        onClick={cycleStatus}
        disabled={update.isPending}
        className="shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
        title="Click to cycle status"
      >
        <TaskStatusIcon status={task.status} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 truncate text-xs text-slate-600">{task.description}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <PriorityBadge priority={task.priority} />
        <TaskStatusBadge status={task.status} />
        <button
          onClick={() => remove.mutate(task.id)}
          disabled={remove.isPending}
          className="rounded-md p-1 text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  )
}

const STATUS_GROUPS: { key: TaskStatus; label: string }[] = [
  { key: 'todo',        label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done',        label: 'Done' },
]

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  const { data: project, isLoading } = useProject(projectId)
  const { data: tasks = [] } = useTasks(projectId)
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) return <PageLoader />
  if (!project) return <p className="text-slate-500">Project not found.</p>

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects" className="rounded-lg p-2 text-slate-500 hover:bg-surface-700 hover:text-slate-300 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
          <h2 className="truncate text-xl font-bold text-slate-100">{project.name}</h2>
          <ProjectStatusBadge status={project.status} />
        </div>
      </div>

      {/* Progress */}
      <Card>
        <ProgressBar value={project.completed_tasks} max={project.task_count} color={project.color} />
      </Card>

      {/* Task groups */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Tasks ({tasks.length})</h3>
        <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowCreate(true)}>
          Add Task
        </Button>
      </div>

      {tasks.length === 0 && (
        <Card className="py-16 text-center">
          <p className="text-slate-500">No tasks yet. Add your first one!</p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {STATUS_GROUPS.map(({ key, label }) => {
          const group = tasks.filter(t => t.status === key)
          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
                <span className="rounded-full bg-surface-700 px-2 py-0.5 text-xs text-slate-500">
                  {group.length}
                </span>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-surface-800 p-1.5 min-h-[80px]">
                {group.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-700">Empty</p>
                ) : (
                  <ul className="space-y-0.5">
                    {group.map(t => (
                      <TaskRow key={t.id} task={t} projectId={projectId} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} projectId={projectId} />
    </div>
  )
}
