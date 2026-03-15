export interface ProgressOverview {
  totalStudyMins: number
  totalStudyHours: string
  totalSessionDays: number
  currentStreak: number
  longestStreak: number
  overallProgress: number
  daysUntilExam: number
  examDate: string
  examType: string
  targetScore: string
}

export interface ScoreHistoryItem {
  testId: string
  examSetName: string | null
  examType: string
  testMode: string
  scaledScore: string
  totalScore: number
  sectionScores: { section: string; percentage: number }[]
  takenAt: string
  isRetake: boolean
}

export interface SectionBreakdownItem {
  section: string
  averageScore: number
  bestScore: number
  worstScore: number
  totalAttempts: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface WeakAreaItem {
  area: string
  frequency: number
  lastSeen: string
  recommendation: string
  relatedSections: string[]
}

export interface SkillTimeItem {
  skill: string
  mins: number
  percentage: number
}

export interface WeeklyDataItem {
  week: number
  weekLabel: string
  completedMins: number
  targetMins: number
  completionRate: number
}

export interface StudyTimeStats {
  totalMins: number
  bySkill: SkillTimeItem[]
  byWeek: WeeklyDataItem[]
  dailyAvgMins: number
  mostProductiveDay: string
  longestSession: number
}

export interface MilestoneItem {
  _id: string
  title: string
  description: string
  weekNumber: number
  targetDate: string
  achieved: boolean
  achievedAt: string | null
  daysEarly?: number
  daysLate?: number
}

export interface PlanComparisonItem {
  planId: string
  examType: string
  targetScore: string
  testsCount: number
  bestScore: string
  latestScore: string
  status: string
}

export interface ProgressData {
  overview: ProgressOverview
  scoreHistory: ScoreHistoryItem[]
  sectionBreakdown: SectionBreakdownItem[]
  weakAreaAnalysis: WeakAreaItem[]
  studyTimeStats: StudyTimeStats
  milestones: MilestoneItem[]
  planComparison: PlanComparisonItem[]
}

export interface ShareCardData {
  userName: string
  examType: string
  targetScore: string
  currentBestScore: string
  overallProgress: number
  currentStreak: number
  totalStudyHours: string
  testsCompleted: number
  latestWeakAreas: string[]
  daysUntilExam: number
  planStartDate: string
}
