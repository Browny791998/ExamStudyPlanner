'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type { IQuestion } from '@/types/question'
import type { QuestionFormData } from '@/validations/questionSchema'
import { toast } from 'sonner'

export interface AdminQuestionsFilters {
  examType?: string
  section?: string
  questionType?: string
  difficulty?: string
  search?: string
  page?: number
  limit?: number
  includeDeleted?: boolean
}

export interface AdminQuestionsResponse {
  questions: IQuestion[]
  total: number
  page: number
  totalPages: number
}

export interface AdminStats {
  totalQuestions: number
  questionsByExam: { examType: string; count: number }[]
  questionsByType: { questionType: string; count: number }[]
  totalUsers: number
  activeStudyPlans: number
  totalMockTests: number
  recentQuestions: IQuestion[]
}

export function useAdminQuestions(filters: AdminQuestionsFilters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'questions', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.examType) params.set('examType', filters.examType)
      if (filters.section) params.set('section', filters.section)
      if (filters.questionType) params.set('questionType', filters.questionType)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.search) params.set('search', filters.search)
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))
      if (filters.includeDeleted) params.set('includeDeleted', 'true')

      const res = await axios.get(`/api/admin/questions?${params.toString()}`)
      return res.data.data as AdminQuestionsResponse
    },
    staleTime: 60 * 1000,
  })

  return {
    questions: data?.questions ?? [],
    total: data?.total ?? 0,
    totalPages: data?.totalPages ?? 1,
    isLoading,
    error,
  }
}

export function useAdminStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => {
      const res = await axios.get('/api/admin/stats')
      return res.data.data as AdminStats
    },
    staleTime: 5 * 60 * 1000,
  })

  return { stats: data ?? null, isLoading, error }
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const res = await axios.post('/api/admin/questions', data)
      return res.data.data.question as IQuestion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Question created successfully')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to create question'
        : 'Failed to create question'
      toast.error(msg)
    },
  })

  return { createQuestion: mutate, isPending, error }
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuestionFormData> }) => {
      const res = await axios.put(`/api/admin/questions/${id}`, data)
      return res.data.data.question as IQuestion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] })
      toast.success('Question updated successfully')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to update question'
        : 'Failed to update question'
      toast.error(msg)
    },
  })

  return { updateQuestion: mutate, isPending }
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/questions/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      toast.success('Question deleted successfully')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to delete question'
        : 'Failed to delete question'
      toast.error(msg)
    },
  })

  return { deleteQuestion: mutate, isPending }
}

export interface ImportResult {
  inserted: number
  failed: number
  errors: { row: number; message: string }[]
}

export function useImportQuestions() {
  const qc = useQueryClient()
  const { mutate, isPending, data: result } = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await axios.post('/api/admin/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data.data as ImportResult
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'questions'] })
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] })
      if (data.failed > 0) {
        toast.warning(`${data.inserted} imported, ${data.failed} failed`)
      } else {
        toast.success(`${data.inserted} questions imported successfully`)
      }
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Import failed'
        : 'Import failed'
      toast.error(msg)
    },
  })

  return { importQuestions: mutate, isPending, result }
}
