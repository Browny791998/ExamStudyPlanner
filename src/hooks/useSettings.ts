'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { toast } from 'sonner'
import { useAppDispatch } from '@/store/hooks'
import { patchUser } from '@/store/slices/authSlice'
import type { ProfileFormData, PasswordFormData } from '@/validations/settingsSchema'

interface SettingsUser {
  _id: string
  name: string
  email: string
  role: string
  createdAt: string
}

interface SettingsData {
  user: SettingsUser
}

export function useSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await axios.get('/api/settings')
      return res.data.data as SettingsData
    },
    staleTime: 10 * 60 * 1000,
  })
  return { settings: data, isLoading }
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  const dispatch = useAppDispatch()

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await axios.patch('/api/settings/profile', data)
      return res.data.data.user as SettingsUser
    },
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      dispatch(patchUser({ name: user.name }))
      toast.success('Profile updated successfully')
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? error.message ?? 'Something went wrong')
      } else {
        toast.error('Something went wrong')
      }
    },
  })

  return { updateProfile: mutate, isPending }
}

export function useUpdatePassword() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const res = await axios.patch('/api/settings/password', data)
      return res.data
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: unknown) => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error ?? error.message ?? 'Something went wrong')
      } else {
        toast.error('Something went wrong')
      }
    },
  })

  return { updatePassword: mutate, isPending }
}
