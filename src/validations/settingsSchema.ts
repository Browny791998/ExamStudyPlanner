import { z } from 'zod'

export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be under 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
    .regex(/[0-9]/, 'Must contain one number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain one special character'),
  confirmNewPassword: z.string(),
})
.refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
})
.refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must differ from current',
  path: ['newPassword'],
})

export type ProfileFormData = z.infer<typeof profileSchema>
export type PasswordFormData = z.infer<typeof passwordSchema>
