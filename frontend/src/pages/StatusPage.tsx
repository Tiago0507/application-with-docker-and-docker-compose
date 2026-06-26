import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Database, Zap, Server, BarChart3 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useServicesHealth } from '../hooks/useMetrics'
import { useMetricsSummary } from '../hooks/useMetrics'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PageLoader } from '../components/ui/Spinner'

type HealthStatus = 'healthy' | 'unhealthy' | 'degraded'

function StatusIcon({ status }: { status: HealthStatus }) {
  if (status === 'healthy')   return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
  if (status === 'degraded')  return <AlertCircle  className="h-5 w-5 text-amber-400" />
  return <XCircle className="h-5 w-5 text-red-400" />
}

function statusColor(s: HealthStatus) {
  return s === 'healthy' ? 'text-emerald-400' : s === 'degraded' ? 'text-amber-400' : 'text-red-400'
}

function ServiceCard({
  name, status, icon: Icon, detail,
}: { name: string; status: HealthStatus; icon: React.ElementType; detail?: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-700">
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-200">{name}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5 truncate">{detail}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-medium capitalize ${statusColor(status)}`}>{status}</span>
        <StatusIcon status={status} />
      </div>
    </Card>
  )
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-slate-200">{value}</span>
    </div>
  )
}

export function StatusPage() {
  const qc = useQueryClient()
  const { data: health, isLoading } = useServicesHealth()
  const { data: summary } = useMetricsSummary()

  if (isLoading) return <PageLoader />

  const services = [
    {
      name: 'Backend API',
      status: (health?.api.status ?? 'unhealthy') as HealthStatus,
      icon: Server,
      detail: 'FastAPI · PostgreSQL · Redis',
    },
    {
      name: 'Metrics Service',
      status: (health?.metrics.status ?? 'unhealthy') as HealthStatus,
      icon: BarChart3,
      detail: 'NestJS · PostgreSQL',
    },
    {
      name: 'Redis Cache',
      status: (health?.redis.status ?? 'unhealthy') as HealthStatus,
      icon: Zap,
      detail: 'In-memory caching layer',
    },
    {
      name: 'PostgreSQL',
      status: (health?.api.status === 'healthy' ? 'healthy' : 'unhealthy') as HealthStatus,
      icon: Database,
      detail: 'Primary database',
    },
  ]

  const allHealthy = services.every(s => s.status === 'healthy')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overall status */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        allHealthy
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-red-500/30 bg-red-500/5'
      }`}>
        {allHealthy
          ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          : <AlertCircle className="h-5 w-5 text-amber-400" />
        }
        <div>
          <p className={`font-semibold ${allHealthy ? 'text-emerald-400' : 'text-amber-400'}`}>
            {allHealthy ? 'All systems operational' : 'Some services are unavailable'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {allHealthy
              ? 'All 4 services are running correctly'
              : 'Check that Docker containers are running'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          className="ml-auto"
          onClick={() => qc.invalidateQueries({ queryKey: ['health'] })}
        >
          Re-check
        </Button>
      </div>

      {/* Services */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Services</h2>
        <div className="space-y-3">
          {services.map(s => (
            <ServiceCard key={s.name} {...s} />
          ))}
        </div>
      </div>

      {/* Metrics breakdown */}
      {summary && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Project Events</CardTitle></CardHeader>
            <div className="divide-y divide-slate-700/50">
              <MetricRow label="Created"  value={summary.projects_created} />
              <MetricRow label="Updated"  value={summary.projects_updated} />
              <MetricRow label="Deleted"  value={summary.projects_deleted} />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Task Events</CardTitle></CardHeader>
            <div className="divide-y divide-slate-700/50">
              <MetricRow label="Created"   value={summary.tasks_created} />
              <MetricRow label="Completed" value={summary.tasks_completed} />
              <MetricRow label="Updated"   value={summary.tasks_updated} />
              <MetricRow label="Deleted"   value={summary.tasks_deleted} />
            </div>
          </Card>
        </div>
      )}

      {/* Architecture note */}
      <Card className="border-dashed">
        <CardHeader><CardTitle>Architecture Overview</CardTitle></CardHeader>
        <div className="space-y-2 font-mono text-xs text-slate-500">
          <p>Browser → Nginx (port 80)</p>
          <p className="pl-4">├── /api/*      → backend-api:8000  (FastAPI)</p>
          <p className="pl-4">├── /metrics/*  → backend-metrics:3001 (NestJS)</p>
          <p className="pl-4">└── /*          → frontend:80  (React + Vite)</p>
          <p className="mt-3">backend-api → postgres:5432  (SQLAlchemy async)</p>
          <p>backend-api → redis:6379     (caching)</p>
          <p>backend-api → backend-metrics:3001 (HTTP events)</p>
          <p>backend-metrics → postgres:5432  (TypeORM)</p>
        </div>
      </Card>
    </div>
  )
}
