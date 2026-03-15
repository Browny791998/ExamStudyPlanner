'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import type { IDailyTask, IMilestone } from '@/types/studyPlan'

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  currentStreak: number
  longestStreak: number
  totalStudyMins: number
  daysUntilExam: number
  overallProgress: number
  weeklyProgress: number
}

export interface DashboardData {
  todayTasks: IDailyTask[]
  upcomingTasks: IDailyTask[]
  currentWeekTasks: IDailyTask[]
  milestones: IMilestone[]
  recentMockScores: { date: string; score: number; maxScore: number; examType: string }[]
  stats: DashboardStats
}

export function useDashboardData(planId?: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', planId ?? 'default'],
    queryFn: async () => {
      const url = planId ? `/api/dashboard?planId=${planId}` : '/api/dashboard'
      const res = await axios.get(url)
      return res.data.data as DashboardData | null
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
  return { data: data ?? null, isLoading, error, refetch }
}

export function useCalendarData(month: number, year: number, planId?: string | null) {
  const { data, isLoading } = useQuery({
    queryKey: ['calendar', month, year, planId ?? 'default'],
    queryFn: async () => {
      const params = new URLSearchParams({ month: String(month), year: String(year) })
      if (planId) params.set('planId', planId)
      const res = await axios.get(`/api/calendar?${params.toString()}`)
      return res.data.data as Record<string, {
        tasks: IDailyTask[]
        completedCount: number
        totalCount: number
        hasTest: boolean
      }>
    },
    staleTime: 5 * 60 * 1000,
  })
  return { calendarData: data ?? {}, isLoading }
}

export function useCompleteTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ taskId, completed, notes }: { taskId: string; completed: boolean; notes?: string }) => {
      const res = await axios.patch(`/api/daily-tasks/${taskId}/complete`, { completed, notes })
      return res.data.data
    },
    onMutate: async ({ taskId, completed }) => {
      await qc.cancelQueries({ queryKey: ['dashboard'], exact: false })
      // Update all cached dashboard queries (any planId)
      const cache = qc.getQueriesData<DashboardData>({ queryKey: ['dashboard'], exact: false })
      cache.forEach(([key, prev]) => {
        if (prev) {
          qc.setQueryData<DashboardData>(key, {
            ...prev,
            todayTasks: prev.todayTasks.map(t => t._id === taskId ? { ...t, completed } : t),
            currentWeekTasks: prev.currentWeekTasks.map(t => t._id === taskId ? { ...t, completed } : t),
          })
        }
      })
      return { cache }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.cache?.forEach(([key, prev]) => {
        if (prev) qc.setQueryData(key, prev)
      })
    },
    onSuccess: () => {
      // Invalidate all dashboard queries regardless of planId
      qc.invalidateQueries({ queryKey: ['dashboard'], exact: false })
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['study-plan', 'active'] })
      qc.invalidateQueries({ queryKey: ['progress'] })
    },
  })
  return { completeTask: mutate, isCompleting: isPending }
}

export function useGCalSync() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (planId: string) => {
      const res = await axios.post('/api/calendar/sync-gcal', { planId })
      return res.data.data as { synced: number; failed: number }
    },
    onSuccess: (data) => {
      toast.success(`${data.synced} tasks synced to Google Calendar`)
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Sync failed'
      toast.error(msg ?? 'Sync failed')
    },
  })
  return { syncToGCal: mutate, isSyncing: isPending }
}
