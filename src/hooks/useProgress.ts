'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { ProgressData, ShareCardData } from '@/types/progress'

export function useProgressData(planId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['progress', planId ?? 'default'],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : ''
      const res = await axios.get(`/api/progress${params}`)
      return res.data.data as ProgressData
    },
    staleTime: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
  return { data: data ?? null, isLoading, error, refetch }
}

export function useShareCardData(planId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['progress', 'share-card', planId ?? 'default'],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : ''
      const res = await axios.get(`/api/progress/share-card${params}`)
      return res.data.data as ShareCardData
    },
    staleTime: 5 * 60 * 1000,
  })
  return { cardData: data ?? null, isLoading }
}

export function useInvalidateProgress() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['progress'] })
}
