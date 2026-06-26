import type {
  Project,
  ProjectDetail,
  Task,
  MetricsSummary,
  ActivityEvent,
  ServiceHealth,
} from '../types'

const API = '/api/v1'
const METRICS = '/metrics'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => request<Project[]>(`${API}/projects`),

  get: (id: number) => request<ProjectDetail>(`${API}/projects/${id}`),

  create: (body: { name: string; description?: string; color?: string; status?: string }) =>
    request<Project>(`${API}/projects`, { method: 'POST', body: JSON.stringify(body) }),

  update: (id: number, body: Partial<{ name: string; description: string; color: string; status: string }>) =>
    request<Project>(`${API}/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: number) =>
    request<void>(`${API}/projects/${id}`, { method: 'DELETE' }),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (projectId: number) =>
    request<Task[]>(`${API}/projects/${projectId}/tasks`),

  create: (
    projectId: number,
    body: { title: string; description?: string; status?: string; priority?: string },
  ) =>
    request<Task>(`${API}/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (
    taskId: number,
    body: Partial<{ title: string; description: string; status: string; priority: string }>,
  ) =>
    request<Task>(`${API}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(body) }),

  delete: (taskId: number) =>
    request<void>(`${API}/tasks/${taskId}`, { method: 'DELETE' }),
}

// ── Metrics ───────────────────────────────────────────────────────────────────
export const metricsApi = {
  summary: () => request<MetricsSummary>(`${METRICS}/summary`),
  activity: (limit = 15) => request<ActivityEvent[]>(`${METRICS}/activity?limit=${limit}`),
}

// ── Health ────────────────────────────────────────────────────────────────────
export const healthApi = {
  api: () => request<ServiceHealth>('/health'),
  metrics: () => request<ServiceHealth>('/health-metrics'),
  redis: () => request<ServiceHealth>(`${API}/health/redis`),
}
