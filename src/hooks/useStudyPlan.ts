'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { IStudyPlan, IDailyTask } from '@/types/studyPlan'
import type { CreateStudyPlanFormData } from '@/validations/studyPlanSchema'
import { startOfDay } from 'date-fns'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearActivePlan } from '@/store/slices/studyPlanSlice'
import { patchUser } from '@/store/slices/authSlice'
import { setSelectedPlanId } from '@/store/slices/uiSlice'

export function useStudyPlans() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['study-plan', 'active'],
    queryFn: async () => {
      const res = await axios.get('/api/study-plans')
      return res.data.data.plans as IStudyPlan[]
    },
    staleTime: 5 * 60 * 1000,
  })
  return { plans: data ?? [], isLoading, error }
}

/** Convenience: returns the first active plan (for backward compat with sidebar etc.) */
export function useActivePlan() {
  const { plans, isLoading, error } = useStudyPlans()
  return { plan: plans[0] ?? null, isLoading, error }
}

/**
 * Returns the currently selected plan (from Redux ui.selectedPlanId),
 * falling back to the first plan if none is selected.
 * Also exposes a setter to switch plans.
 */
export function useSelectedPlan() {
  const dispatch = useAppDispatch()
  const selectedPlanId = useAppSelector(s => s.ui.selectedPlanId)
  const { plans, isLoading, error } = useStudyPlans()

  const selectedPlan = plans.find(p => p._id === selectedPlanId) ?? plans[0] ?? null

  const selectPlan = (planId: string) => dispatch(setSelectedPlanId(planId))

  return { selectedPlan, plans, isLoading, error, selectPlan, selectedPlanId: selectedPlan?._id ?? null }
}

export function useDailyTasks(date?: string, week?: number, planId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['daily-tasks', { date, week, planId }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (date) params.set('date', date)
      if (week !== undefined) params.set('week', String(week))
      if (planId) params.set('planId', planId)
      const res = await axios.get(`/api/daily-tasks?${params.toString()}`)
      return (res.data.data ?? []) as IDailyTask[]
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!planId || !!date || week !== undefined,
  })
  return { tasks: data ?? [], isLoading, error }
}

export function useCreateStudyPlan() {
  const qc = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (formData: CreateStudyPlanFormData) => {
      const res = await axios.post('/api/study-plans', formData)
      return res.data.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-plan'] })
    },
  })
  const errorMsg =
    error instanceof Error
      ? error.message
      : (error as unknown as { response?: { data?: { error?: string } } })?.response?.data?.error ?? null
  return { mutate, isPending, error: errorMsg }
}

export function useCompleteTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ taskId, notes }: { taskId: string; notes?: string }) => {
      const res = await axios.patch(`/api/daily-tasks/${taskId}`, { completed: true, notes })
      return res.data.data
    },
    onMutate: async ({ taskId }) => {
      await qc.cancelQueries({ queryKey: ['daily-tasks'] })
      const todayKey = ['daily-tasks', { date: startOfDay(new Date()).toISOString() }]
      const prev = qc.getQueryData<IDailyTask[]>(todayKey)
      if (prev) {
        qc.setQueryData(
          todayKey,
          prev.map((t) => (t._id === taskId ? { ...t, completed: true } : t))
        )
      }
      return { prev, todayKey }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(context.todayKey, context.prev)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
    },
  })
  return { mutate, isPending }
}

export function useAddTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: {
      planId: string
      scheduledDate: string
      title: string
      description?: string
      skillFocus: IDailyTask['skillFocus']
      taskType: IDailyTask['taskType']
      durationMins: number
    }) => {
      const res = await axios.post('/api/daily-tasks', data)
      return res.data.data.task as IDailyTask
    },
    onSuccess: (_task, vars) => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
      qc.invalidateQueries({ queryKey: ['dashboard', vars.planId] })
    },
  })
  return { addTask: mutate, isPending }
}

export function useDeleteTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await axios.delete(`/api/daily-tasks/${taskId}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
    },
  })
  return { deleteTask: mutate, isPending }
}

const STANDARD_EXAM_TYPES = ['IELTS', 'TOEFL', 'JLPT', 'SAT'] as const

/**
 * Returns exam types for question/exam-set creation:
 * the 4 standard types + any custom exam types from the user's active plans.
 */
export function useUserExamTypes(): string[] {
  const { plans } = useStudyPlans()
  const customTypes = plans
    .map(p => p.examType)
    .filter(t => !(STANDARD_EXAM_TYPES as readonly string[]).includes(t))
  return [...STANDARD_EXAM_TYPES, ...Array.from(new Set(customTypes))]
}

export function useDeletePlan() {
  const qc = useQueryClient()
  const dispatch = useAppDispatch()
  const { mutate, isPending } = useMutation({
    mutationFn: async (planId: string) => {
      const res = await axios.delete(`/api/study-plans/${planId}`)
      return res.data
    },
    onSuccess: async () => {
      // Refresh plans — if none left, also reset onboarding flag
      await qc.invalidateQueries({ queryKey: ['study-plan'] })
      const updated = qc.getQueryData<IStudyPlan[]>(['study-plan', 'active'])
      if (!updated || updated.length === 0) {
        dispatch(clearActivePlan())
        dispatch(patchUser({ hasCompletedOnboarding: false }))
      }
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
  return { mutate, isPending }
}
