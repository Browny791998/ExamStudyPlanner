import { z } from 'zod'
import { addDays } from 'date-fns'

export const createStudyPlanSchema = z.discriminatedUnion('planMode', [
  // Standard predefined exam types (90 days, exam date required)
  z.object({
    planMode: z.literal('standard'),
    examType: z.enum(['IELTS', 'TOEFL', 'JLPT', 'SAT']),
    targetScore: z.string().min(1, 'Target score is required'),
    examDate: z.string().refine(
      (val) => {
        const date = new Date(val)
        if (isNaN(date.getTime())) return false
        return date >= addDays(new Date(), 30)
      },
      { message: 'Exam date must be at least 30 days from today' }
    ),
  }),
  // Custom exam type — user-defined name, duration, optional exam date
  z.object({
    planMode: z.literal('custom'),
    examType: z.literal('CUSTOM'),
    customExamName: z.string()
      .min(2, 'Exam name must be at least 2 characters')
      .max(50, 'Exam name must be under 50 characters'),
    targetScore: z.string().min(1, 'Target goal is required').max(50),
    planDays: z.number()
      .int('Must be a whole number')
      .min(1, 'Plan must be at least 1 day')
      .max(365, 'Plan cannot exceed 365 days'),
    examDate: z.string().optional(),
  }),
])

export type CreateStudyPlanFormData = z.infer<typeof createStudyPlanSchema>

// Legacy exports kept for backward compatibility
export const studyPlanSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  examType: z.string().min(1, 'Exam type is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalHours: z.coerce.number().min(1, 'Total hours must be at least 1'),
})

export const dailyTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  scheduledDate: z.coerce.date(),
  durationMinutes: z.coerce.number().min(5, 'Duration must be at least 5 minutes'),
})

export type StudyPlanInput = z.infer<typeof studyPlanSchema>
export type DailyTaskInput = z.infer<typeof dailyTaskSchema>
