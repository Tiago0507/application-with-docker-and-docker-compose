import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../api/client'
import { PROJECT_KEYS } from './useProjects'

const TASK_KEYS = {
  byProject: (projectId: number) => ['tasks', projectId] as const,
}

export function useTasks(projectId: number) {
  return useQuery({
    queryKey: TASK_KEYS.byProject(projectId),
    queryFn: () => tasksApi.list(projectId),
    enabled: projectId > 0,
    staleTime: 15_000,
  })
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Parameters<typeof tasksApi.create>[1]) =>
      tasksApi.create(projectId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all })
    },
  })
}

export function useUpdateTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Parameters<typeof tasksApi.update>[1]) =>
      tasksApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(projectId) })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all })
    },
  })
}

export function useDeleteTask(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TASK_KEYS.byProject(projectId) })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all })
    },
  })
}
