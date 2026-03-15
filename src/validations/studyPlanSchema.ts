import { z } from 'zod'
import { addDays } from 'date-fns'

export const createStudyPlanSchema = z.object({
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
})

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
