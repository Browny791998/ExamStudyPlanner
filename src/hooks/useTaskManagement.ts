'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { format } from 'date-fns'
import type { IDailyTask } from '@/types/studyPlan'
import type { DailyTaskFormData } from '@/validations/questionSchema'

export function useAddTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: DailyTaskFormData) => {
      const res = await axios.post('/api/daily-tasks', data)
      return res.data.data.task as IDailyTask
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['calendar'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
      toast.success(`Task added to ${format(new Date(task.scheduledDate), 'MMM d, yyyy')}`)
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to add task'
        : 'Failed to add task'
      toast.error(msg)
    },
  })

  return { addTask: mutate, isPending }
}

export function useEditTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Omit<DailyTaskFormData, 'planId'>> & { notes?: string }
    }) => {
      const res = await axios.patch(`/api/daily-tasks/${id}`, data)
      return res.data.data.task as IDailyTask
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['calendar'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
      toast.success('Task updated successfully')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to update task'
        : 'Failed to update task'
      toast.error(msg)
    },
  })

  return { editTask: mutate, isPending }
}

export function useDeleteTask() {
  const qc = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/daily-tasks/${id}`)
      return res.data.data as { newProgress: number }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-tasks'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      qc.invalidateQueries({ queryKey: ['calendar'] })
      qc.invalidateQueries({ queryKey: ['study-plan'] })
      toast.success('Task deleted')
    },
    onError: (err) => {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to delete task'
        : 'Failed to delete task'
      toast.error(msg)
    },
  })

  return { deleteTask: mutate, isPending }
}
