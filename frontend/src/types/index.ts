export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Project {
  id: number
  name: string
  description: string | null
  color: string
  status: ProjectStatus
  task_count: number
  completed_tasks: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  project_id: number
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  created_at: string
  updated_at: string
}

export interface ProjectDetail extends Project {
  tasks: Pick<Task, 'id' | 'title' | 'status' | 'priority'>[]
}

export interface MetricsSummary {
  projects_created: number
  projects_updated: number
  projects_deleted: number
  tasks_created: number
  tasks_completed: number
  tasks_updated: number
  tasks_deleted: number
  total_events: number
}

export interface ActivityEvent {
  id: number
  type: string
  payload: Record<string, unknown>
  created_at: string
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'degraded'
  service: string
  version?: string
  database?: string
  timestamp?: string
}
