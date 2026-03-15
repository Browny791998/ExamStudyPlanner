export interface IStudyPlan {
  _id: string
  userId: string
  title: string
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  targetScore: string
  examDate: string // ISO
  startDate: string // ISO
  endDate: string // ISO
  status: 'active' | 'completed' | 'paused'
  overallProgress: number
  weeklyGoals: { week: number; focus: string; targetTasksCount: number }[]
  createdAt: string
  updatedAt: string
}

export interface IDailyTask {
  _id: string
  planId: string
  userId: string
  scheduledDate: string // ISO
  dayNumber: number
  weekNumber: number
  title: string
  description: string
  skillFocus: 'Reading' | 'Writing' | 'Listening' | 'Speaking' | 'Vocabulary' | 'Grammar' | 'Math' | 'Mock Test'
  taskType: 'drill' | 'mock_test' | 'revision' | 'vocabulary' | 'essay'
  durationMins: number
  completed: boolean
  completedAt: string | null
  gcalEventId: string | null
  notes: string
  isCustom: boolean
  createdAt: string
  subject: string // same as skillFocus for backwards compat with UpcomingTasks component
  durationMinutes: number // alias for durationMins
}

export interface IMilestone {
  _id: string
  planId: string
  userId: string
  title: string
  description: string
  weekNumber: number
  targetDate: string
  achieved: boolean
  achievedAt: string | null
  createdAt: string
}

export interface GeneratedPlan {
  plan: Partial<IStudyPlan>
  tasks: Partial<IDailyTask>[]
  milestones: Partial<IMilestone>[]
}

export type CreateStudyPlanFormData = {
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  targetScore: string
  examDate: string
}
