'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import type { IQuestion } from '@/types/question'

export interface CustomQuestionFormData {
  examType: string
  section: string
  questionType: 'multiple_choice' | 'fill_blank'
  difficulty: 'easy' | 'medium' | 'hard'
  question: string
  passage?: string
  options?: string[]
  correctAnswer?: string
  blanks?: { index: number; answer: string; hint?: string }[]
  explanation: string
  tags?: string[]
  includeInDrills: boolean
}

export function useCustomQuestions() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['questions', 'custom'],
    queryFn: async () => {
      const res = await axios.get('/api/questions/custom')
      return res.data.data as { questions: IQuestion[]; count: number }
    },
    staleTime: 2 * 60 * 1000,
  })

  return {
    questions: data?.questions ?? [],
    count: data?.count ?? 0,
    isLoading,
    error,
  }
}

export function useCreateCustomQuestion() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: CustomQuestionFormData) => {
      const res = await axios.post('/api/questions/custom', data)
      return res.data.data.question as IQuestion
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', 'custom'] })
      toast.success('Custom question saved')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to save question'
        : 'Failed to save question'
      toast.error(msg)
    },
  })

  return { createQuestion: mutate, isPending }
}

export function useDeleteCustomQuestion() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/questions/custom/${id}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['questions', 'custom'] })
      toast.success('Question deleted')
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
