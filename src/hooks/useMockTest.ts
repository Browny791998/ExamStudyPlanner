'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAppDispatch } from '@/store/hooks'
import {
  setActiveTest,
  clearActiveTest,
  setLastResult,
} from '@/store/slices/mockTestSlice'
import type { IMockTest, IMockResult, IQuestionFull } from '@/types/mockTest'

export function useStartMockTest() {
  const dispatch = useAppDispatch()
  const router = useRouter()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (params: {
      examType: string
      testMode: 'full' | 'section' | 'drill'
      section?: string
      taskId?: string
      examSetId?: string
      includeCustomQuestions?: boolean
      isScheduled?: boolean
      isRetake?: boolean
    }) => {
      const res = await axios.post('/api/mock-tests', params)
      return res.data.data as { test: IMockTest; questions: IQuestionFull[] }
    },
    onSuccess: (data) => {
      dispatch(setActiveTest(data))
      router.push(`/mock-test/${data.test._id}`)
    },
  })

  return {
    startTest: mutate,
    isPending,
    error: axios.isAxiosError(error) ? error.response?.data?.error : null,
  }
}

export function useSubmitAnswer() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (params: {
      testId: string
      questionId: string
      userAnswer: string | string[]
      timeSpentSecs: number
      flagged?: boolean
    }) => {
      const res = await axios.patch(`/api/mock-tests/${params.testId}/answer`, {
        questionId: params.questionId,
        userAnswer: params.userAnswer,
        timeSpentSecs: params.timeSpentSecs,
        flagged: params.flagged ?? false,
      })
      return res.data.data as { isCorrect: boolean | null; pointsEarned: number; explanation: string }
    },
  })

  return { submitAnswer: mutate, isPending }
}

export function useSubmitTest() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (testId: string) => {
      const res = await axios.post(`/api/mock-tests/${testId}/submit`)
      return { result: res.data.data as IMockResult, testId }
    },
    onSuccess: ({ result, testId }) => {
      dispatch(setLastResult(result))
      dispatch(clearActiveTest())
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['mock-tests'] })
      qc.invalidateQueries({ queryKey: ['progress'] })
      router.push(`/mock-test/${testId}/results`)
    },
  })

  return { submitTest: mutate, isPending }
}

export function useMockTestDetail(testId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['mock-test', testId],
    queryFn: async () => {
      const res = await axios.get(`/api/mock-tests/${testId}`)
      return res.data.data as { test: IMockTest; questions: IQuestionFull[]; result: IMockResult | null }
    },
    enabled: !!testId,
    staleTime: 0,
  })

  return {
    test: data?.test ?? null,
    questions: data?.questions ?? [],
    result: data?.result ?? null,
    isLoading,
    error,
  }
}

export function useMockTestHistory(planId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['mock-tests', 'history', planId],
    queryFn: async () => {
      const params = planId ? `?planId=${planId}` : ''
      const res = await axios.get(`/api/mock-tests${params}`)
      return res.data.data as (IMockTest & { result?: IMockResult })[]
    },
    staleTime: 2 * 60 * 1000,
  })

  return { tests: data ?? [], isLoading }
}

export function useDeleteTest() {
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (testId: string) => {
      await axios.delete(`/api/mock-tests/${testId}`)
      return testId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mock-tests'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  return { deleteTest: mutate, isPending }
}

export function useAbandonTest() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: async (testId: string) => {
      await axios.delete(`/api/mock-tests/${testId}`)
      return testId
    },
    onSuccess: () => {
      dispatch(clearActiveTest())
      qc.invalidateQueries({ queryKey: ['mock-tests'] })
      router.push('/mock-test')
    },
  })

  return { abandonTest: mutate, isPending }
}
