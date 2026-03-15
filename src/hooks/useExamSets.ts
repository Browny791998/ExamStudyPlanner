'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import type { IExamSetSummary } from '@/store/slices/mockTestSlice'
import type { ExamSetFormData } from '@/validations/examSetSchema'
import type { IQuestion } from '@/types/question'

export interface IExamSetSection {
  section: string
  questions: IQuestion[]
  questionCount: number
}

export interface IExamSetDetail extends IExamSetSummary {
  sections: IExamSetSection[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AdminExamSetsFilters {
  examType?: string
  difficulty?: string
  isPublished?: boolean
  page?: number
  limit?: number
}

export interface AdminExamSetsResponse {
  sets: IExamSetSummary[]
  total: number
  page: number
  limit: number
}

// Admin: paginated exam sets list
export function useAdminExamSets(filters: AdminExamSetsFilters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'exam-sets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.examType) params.set('examType', filters.examType)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.isPublished !== undefined) params.set('isPublished', String(filters.isPublished))
      if (filters.page) params.set('page', String(filters.page))
      if (filters.limit) params.set('limit', String(filters.limit))
      const res = await axios.get(`/api/admin/exam-sets?${params.toString()}`)
      return res.data.data as AdminExamSetsResponse
    },
  })
  return {
    sets: data?.sets ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
  }
}

// Admin: create exam set
export function useCreateExamSet() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ExamSetFormData) => {
      const res = await axios.post('/api/admin/exam-sets', data)
      return res.data.data as IExamSetSummary
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      toast.success('Exam set created')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to create exam set'
      toast.error(msg)
    },
  })
  return { createExamSet: mutate, isPending }
}

// Admin: update exam set
export function useUpdateExamSet(id: string) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Partial<ExamSetFormData>) => {
      const res = await axios.put(`/api/admin/exam-sets/${id}`, data)
      return res.data.data as IExamSetSummary
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'exam-set', id] })
      toast.success('Exam set updated')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to update exam set'
      toast.error(msg)
    },
  })
  return { updateExamSet: mutate, isPending }
}

// Admin: delete exam set
export function useDeleteExamSet() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/admin/exam-sets/${id}`)
      return id
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      toast.success('Exam set deleted')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to delete exam set'
      toast.error(msg)
    },
  })
  return { deleteExamSet: mutate, isPending }
}

// Admin: publish / unpublish
export function usePublishExamSet() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'publish' | 'unpublish' }) => {
      const res = await axios.patch(`/api/admin/exam-sets/${id}`, { action })
      return res.data.data as IExamSetSummary
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      toast.success(data.isPublished ? 'Exam set published' : 'Exam set unpublished')
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to update publish status'
      toast.error(msg)
    },
  })
  return { publishExamSet: mutate, isPending }
}

// Admin: fetch single exam set with populated questions (for question management)
export function useAdminExamSetDetail(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'exam-set', id],
    queryFn: async () => {
      const res = await axios.get(`/api/admin/exam-sets/${id}`)
      return res.data.data as IExamSetDetail
    },
    enabled: !!id,
  })
  return { examSet: data ?? null, isLoading, error }
}

// Admin: add/remove a section
export function useManageExamSetSection(examSetId: string) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: { action: 'add_section' | 'remove_section'; section: string }) => {
      const res = await axios.patch(`/api/admin/exam-sets/${examSetId}`, payload)
      return res.data.data as IExamSetDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'exam-set', examSetId] })
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to update sections'
      toast.error(msg)
    },
  })
  return { manageSection: mutate, isPending }
}

// Admin: add/remove questions from a section
export function useManageExamSetQuestions(examSetId: string) {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: {
      action: 'add_questions' | 'remove_questions'
      section: string
      questionIds: string[]
    }) => {
      const res = await axios.patch(`/api/admin/exam-sets/${examSetId}`, payload)
      return res.data.data as IExamSetDetail
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'exam-sets'] })
      qc.invalidateQueries({ queryKey: ['admin', 'exam-set', examSetId] })
    },
    onError: (err: unknown) => {
      const msg = axios.isAxiosError(err) ? err.response?.data?.error : 'Failed to update questions'
      toast.error(msg)
    },
  })
  return { manageQuestions: mutate, isPending }
}

// Public: fetch published exam sets (for mock test page)
export function useExamSets(params: { examType?: string; difficulty?: string } = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['exam-sets', params],
    queryFn: async () => {
      const query = new URLSearchParams()
      if (params.examType) query.set('examType', params.examType)
      if (params.difficulty) query.set('difficulty', params.difficulty)
      const res = await axios.get(`/api/exam-sets?${query.toString()}`)
      return res.data.data as IExamSetSummary[]
    },
  })
  return { examSets: data ?? [], isLoading, error }
}
