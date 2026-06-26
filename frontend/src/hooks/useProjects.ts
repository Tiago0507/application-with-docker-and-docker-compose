import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '../api/client'

export const PROJECT_KEYS = {
  all: ['projects'] as const,
  detail: (id: number) => ['projects', id] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: PROJECT_KEYS.all,
    queryFn: projectsApi.list,
    staleTime: 20_000,
  })
}

export function useProject(id: number) {
  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projectsApi.get(id),
    staleTime: 15_000,
    enabled: id > 0,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Parameters<typeof projectsApi.update>[1]) =>
      projectsApi.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.all })
      qc.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: PROJECT_KEYS.all }),
  })
}
