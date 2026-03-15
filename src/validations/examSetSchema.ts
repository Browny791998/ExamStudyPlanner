import { z } from 'zod'

export const examSetSectionSchema = z.object({
  section: z.string().min(1, 'Section is required'),
  questions: z.array(z.string()).default([]),
})

export const examSetSchema = z.object({
  examType: z.string().min(1, 'Exam type is required').max(50),
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters').max(500),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  sections: z.array(examSetSectionSchema).min(1, 'At least one section is required'),
  timeLimitMins: z.number().min(10, 'Minimum 10 minutes').max(360, 'Maximum 6 hours'),
})

export const examSetUpdateSchema = examSetSchema.partial()

export type ExamSetFormData = z.infer<typeof examSetSchema>
export type ExamSetUpdateData = z.infer<typeof examSetUpdateSchema>
