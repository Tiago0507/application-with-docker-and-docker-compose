import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2, ArrowRight, FolderOpen } from 'lucide-react'
import { useProjects, useCreateProject, useDeleteProject } from '../hooks/useProjects'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/Spinner'
import { ProjectStatusBadge } from '../components/shared/StatusBadge'
import { ProgressBar } from '../components/shared/ProgressBar'

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

function CreateProjectModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [color, setColor]       = useState(COLORS[0])
  const create = useCreateProject()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await create.mutateAsync({ name: name.trim(), description: desc.trim() || undefined, color })
    setName(''); setDesc(''); setColor(COLORS[0])
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Name *</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My awesome project"
            className="w-full rounded-lg border border-slate-600 bg-surface-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            rows={3}
            placeholder="What is this project about?"
            className="w-full resize-none rounded-lg border border-slate-600 bg-surface-700 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="h-7 w-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 3px #1e2535, 0 0 0 5px ${c}` : undefined,
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={create.isPending} disabled={!name.trim()}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects()
  const deleteProject = useDeleteProject()
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {projects?.length ?? 0} project{projects?.length !== 1 ? 's' : ''}
        </p>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
          New Project
        </Button>
      </div>

      {projects?.length === 0 && (
        <Card className="py-20 text-center">
          <FolderOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="text-slate-400 font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-slate-600">Create your first project to get started</p>
          <Button className="mt-4 mx-auto" onClick={() => setShowCreate(true)}>
            Create Project
          </Button>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects?.map(p => (
          <Card key={p.id} hover className="group flex flex-col gap-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <h3 className="truncate font-semibold text-slate-200 group-hover:text-white transition-colors">
                  {p.name}
                </h3>
              </div>
              <ProjectStatusBadge status={p.status} />
            </div>

            {p.description && (
              <p className="text-xs text-slate-500 line-clamp-2 -mt-1">{p.description}</p>
            )}

            <ProgressBar value={p.completed_tasks} max={p.task_count} color={p.color} />

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => {
                  setDeletingId(p.id)
                  deleteProject.mutate(p.id, { onSettled: () => setDeletingId(null) })
                }}
                disabled={deletingId === p.id}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>

              <Link
                to={`/projects/${p.id}`}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-brand-400 hover:bg-brand-500/10 transition-colors"
              >
                Open <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
