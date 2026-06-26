import { Link } from 'react-router-dom'
import { FolderKanban, CheckCircle2, Clock, Zap, ArrowRight } from 'lucide-react'
import { useProjects } from '../hooks/useProjects'
import { useMetricsSummary, useActivity } from '../hooks/useMetrics'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { PageLoader } from '../components/ui/Spinner'
import { ProjectStatusBadge } from '../components/shared/StatusBadge'
import { ProgressBar } from '../components/shared/ProgressBar'

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-100">{value}</p>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-600">{sub}</p>}
      </div>
    </Card>
  )
}

function eventLabel(type: string) {
  const labels: Record<string, string> = {
    project_created: 'New project created',
    project_updated: 'Project updated',
    project_deleted: 'Project deleted',
    task_created:    'New task added',
    task_completed:  'Task completed',
    task_updated:    'Task updated',
    task_deleted:    'Task deleted',
  }
  return labels[type] ?? type.replace(/_/g, ' ')
}

function eventColor(type: string) {
  if (type.includes('deleted')) return 'bg-red-500'
  if (type.includes('completed')) return 'bg-emerald-500'
  if (type.includes('created')) return 'bg-brand-500'
  return 'bg-slate-500'
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function DashboardPage() {
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: summary } = useMetricsSummary()
  const { data: activity } = useActivity(10)

  if (loadingProjects) return <PageLoader />

  const totalTasks = projects?.reduce((s, p) => s + p.task_count, 0) ?? 0
  const doneTasks  = projects?.reduce((s, p) => s + p.completed_tasks, 0) ?? 0
  const activeProjects = projects?.filter(p => p.status === 'active').length ?? 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={projects?.length ?? 0}
          icon={FolderKanban}
          color="bg-brand-500/15 text-brand-400"
          sub={`${activeProjects} active`}
        />
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={Clock}
          color="bg-sky-500/15 text-sky-400"
        />
        <StatCard
          label="Completed"
          value={doneTasks}
          icon={CheckCircle2}
          color="bg-emerald-500/15 text-emerald-400"
          sub={totalTasks ? `${Math.round((doneTasks / totalTasks) * 100)}% done` : undefined}
        />
        <StatCard
          label="Events Logged"
          value={summary?.total_events ?? '—'}
          icon={Zap}
          color="bg-amber-500/15 text-amber-400"
          sub="via metrics service"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Recent Projects</h2>
            <Link to="/projects" className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {projects?.length === 0 && (
            <Card className="py-12 text-center text-slate-500">
              No projects yet. <Link to="/projects" className="text-brand-400 hover:underline">Create one →</Link>
            </Card>
          )}
          <div className="space-y-3">
            {projects?.slice(0, 5).map(p => (
              <Link key={p.id} to={`/projects/${p.id}`}>
                <Card hover className="group">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                        {p.name}
                      </span>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  {p.description && (
                    <p className="mb-3 text-xs text-slate-500 line-clamp-1">{p.description}</p>
                  )}
                  <ProgressBar value={p.completed_tasks} max={p.task_count} color={p.color} />
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Activity</h2>
          <Card className="p-0 overflow-hidden">
            {!activity || activity.length === 0 ? (
              <p className="p-5 text-center text-xs text-slate-600">No events yet</p>
            ) : (
              <ul className="divide-y divide-slate-700/50">
                {activity.map(ev => (
                  <li key={ev.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${eventColor(ev.type)}`} />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 leading-snug">{eventLabel(ev.type)}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(ev.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
