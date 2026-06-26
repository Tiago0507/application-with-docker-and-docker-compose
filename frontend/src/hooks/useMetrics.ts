import { useQuery } from '@tanstack/react-query'
import { metricsApi, healthApi } from '../api/client'

export function useMetricsSummary() {
  return useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: metricsApi.summary,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useActivity(limit = 15) {
  return useQuery({
    queryKey: ['metrics', 'activity', limit],
    queryFn: () => metricsApi.activity(limit),
    staleTime: 15_000,
    retry: 1,
  })
}

export function useServicesHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const [api, metrics, redis] = await Promise.allSettled([
        healthApi.api(),
        healthApi.metrics(),
        healthApi.redis(),
      ])
      return {
        api: api.status === 'fulfilled' ? api.value : { status: 'unhealthy' as const, service: 'backend-api' },
        metrics: metrics.status === 'fulfilled' ? metrics.value : { status: 'unhealthy' as const, service: 'backend-metrics' },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'unhealthy' as const, service: 'redis' },
      }
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  })
}
