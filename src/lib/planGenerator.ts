import { addDays, startOfDay } from 'date-fns'
import type { IStudyPlan, IDailyTask, IMilestone, GeneratedPlan } from '@/types/studyPlan'
import { DIFFICULTY_WEEK_MAP } from '@/constants/questionTypes'

type ExamType = 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
type SkillFocus = IDailyTask['skillFocus']
type TaskType = IDailyTask['taskType']

interface DayTemplate {
  skillFocus: SkillFocus
  taskType: TaskType
  durationMins: number
  titleOverride?: string
}

// 7-day rotation for each exam type (index 0 = Monday ... 6 = Sunday)
const ROTATIONS: Record<ExamType, DayTemplate[]> = {
  IELTS: [
    { skillFocus: 'Reading',    taskType: 'drill',      durationMins: 60 },
    { skillFocus: 'Listening',  taskType: 'drill',      durationMins: 45 },
    { skillFocus: 'Writing',    taskType: 'essay',      durationMins: 75,  titleOverride: 'Writing Task 1 — Graphs & Charts' },
    { skillFocus: 'Vocabulary', taskType: 'vocabulary', durationMins: 30 },
    { skillFocus: 'Writing',    taskType: 'essay',      durationMins: 90,  titleOverride: 'Writing Task 2 — Opinion Essay' },
    { skillFocus: 'Speaking',   taskType: 'drill',      durationMins: 45 },
    { skillFocus: 'Mock Test',  taskType: 'mock_test',  durationMins: 180 },
  ],
  TOEFL: [
    { skillFocus: 'Reading',    taskType: 'drill',      durationMins: 60 },
    { skillFocus: 'Listening',  taskType: 'drill',      durationMins: 60 },
    { skillFocus: 'Speaking',   taskType: 'drill',      durationMins: 45 },
    { skillFocus: 'Writing',    taskType: 'essay',      durationMins: 75,  titleOverride: 'Writing — Integrated Task' },
    { skillFocus: 'Vocabulary', taskType: 'vocabulary', durationMins: 30 },
    { skillFocus: 'Writing',    taskType: 'essay',      durationMins: 90,  titleOverride: 'Writing — Independent Task' },
    { skillFocus: 'Mock Test',  taskType: 'mock_test',  durationMins: 180 },
  ],
  JLPT: [
    { skillFocus: 'Vocabulary', taskType: 'vocabulary', durationMins: 45,  titleOverride: 'Vocabulary & Kanji Session' },
    { skillFocus: 'Grammar',    taskType: 'drill',      durationMins: 60 },
    { skillFocus: 'Reading',    taskType: 'drill',      durationMins: 60,  titleOverride: 'Reading Comprehension Drill' },
    { skillFocus: 'Listening',  taskType: 'drill',      durationMins: 45 },
    { skillFocus: 'Grammar',    taskType: 'drill',      durationMins: 45 },
    { skillFocus: 'Vocabulary', taskType: 'vocabulary', durationMins: 30,  titleOverride: 'Vocabulary Review' },
    { skillFocus: 'Mock Test',  taskType: 'mock_test',  durationMins: 150 },
  ],
  SAT: [
    { skillFocus: 'Reading',    taskType: 'drill',      durationMins: 60,  titleOverride: 'Reading & Writing Drill' },
    { skillFocus: 'Math',       taskType: 'drill',      durationMins: 45,  titleOverride: 'Math — No Calculator Section' },
    { skillFocus: 'Grammar',    taskType: 'drill',      durationMins: 60,  titleOverride: 'Grammar & Evidence-Based Reading' },
    { skillFocus: 'Math',       taskType: 'drill',      durationMins: 60,  titleOverride: 'Math — Calculator Section' },
    { skillFocus: 'Reading',    taskType: 'drill',      durationMins: 45,  titleOverride: 'Reading Comprehension Drill' },
    { skillFocus: 'Vocabulary', taskType: 'vocabulary', durationMins: 30,  titleOverride: 'Vocabulary in Context' },
    { skillFocus: 'Mock Test',  taskType: 'mock_test',  durationMins: 180 },
  ],
}

function getTaskTitle(template: DayTemplate, examType: ExamType): string {
  if (template.titleOverride) return template.titleOverride
  const { skillFocus, taskType } = template
  if (taskType === 'mock_test') return `Full Mock Test — ${examType}`
  if (taskType === 'revision') return 'Revision & Weak Area Review'
  if (taskType === 'vocabulary') return 'Vocabulary Building Session'
  if (taskType === 'essay') return 'Writing Practice — Essay'
  if (taskType === 'drill') {
    if (skillFocus === 'Reading')   return 'Reading Comprehension Drill'
    if (skillFocus === 'Listening') return 'Listening Practice Session'
    if (skillFocus === 'Grammar')   return 'Grammar Accuracy Drill'
    if (skillFocus === 'Speaking')  return 'Speaking Practice Session'
    if (skillFocus === 'Math')      return 'Math Problem Set'
  }
  return `${skillFocus} Practice`
}

const WEEKLY_GOALS: { weeks: [number, number]; focus: string }[] = [
  { weeks: [1, 3],   focus: 'Foundation & Diagnostics' },
  { weeks: [4, 6],   focus: 'Skill Building' },
  { weeks: [7, 9],   focus: 'Intensive Practice' },
  { weeks: [10, 12], focus: 'Mock Test Sprint' },
  { weeks: [13, 13], focus: 'Final Revision' },
]

function getWeeklyFocus(week: number): string {
  for (const g of WEEKLY_GOALS) {
    if (week >= g.weeks[0] && week <= g.weeks[1]) return g.focus
  }
  return 'Final Revision'
}

const MILESTONE_TEMPLATES: { week: number; title: string; description: string }[] = [
  { week: 2,  title: 'Complete first full mock test',                  description: 'Take your first full mock exam and identify baseline strengths and weaknesses.' },
  { week: 4,  title: 'Review all weak areas from weeks 1–4',           description: 'Analyse results from the first month and focus on your lowest-scoring areas.' },
  { week: 6,  title: 'Score improvement check — retake section tests', description: 'Re-test individual sections to measure your progress since week 1.' },
  { week: 8,  title: 'Complete 4 full mock tests total',               description: 'You should have completed at least 4 timed mock exams by this point.' },
  { week: 10, title: 'Targeted weak-spot drilling sprint',             description: 'Spend this week drilling only the areas where your score is still below target.' },
  { week: 12, title: 'Final full mock test under exam conditions',      description: 'Simulate real exam conditions — timed, no interruptions, full paper.' },
  { week: 13, title: 'Exam ready — final revision',                    description: 'Light review of key concepts, vocabulary, and exam strategy. Rest well!' },
]

interface AvailableExamSet {
  _id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface PlanGeneratorConfig {
  userId: string
  examType: ExamType
  targetScore: string
  examDate: Date
  startDate: Date
  availableSets?: AvailableExamSet[]
}

export function generateStudyPlan(config: PlanGeneratorConfig): GeneratedPlan {
  const { userId, examType, targetScore, examDate, startDate, availableSets = [] } = config
  const start = startOfDay(startDate)
  const endDate = addDays(start, 89) // 90 days inclusive

  const plan: Partial<IStudyPlan> = {
    userId,
    title: `${examType} ${targetScore} — 90-Day Study Plan`,
    examType,
    targetScore,
    examDate: examDate.toISOString(),
    startDate: start.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    overallProgress: 0,
    weeklyGoals: Array.from({ length: 13 }, (_, i) => {
      const week = i + 1
      return {
        week,
        focus: getWeeklyFocus(week),
        targetTasksCount: 7,
      }
    }),
  }

  // Build a pool of exam sets per difficulty for round-robin assignment
  const setsByDifficulty: Record<'easy' | 'medium' | 'hard', AvailableExamSet[]> = {
    easy:   availableSets.filter(s => s.difficulty === 'easy'),
    medium: availableSets.filter(s => s.difficulty === 'medium'),
    hard:   availableSets.filter(s => s.difficulty === 'hard'),
  }
  const setCounters: Record<'easy' | 'medium' | 'hard', number> = { easy: 0, medium: 0, hard: 0 }

  function pickExamSet(week: number): AvailableExamSet | null {
    const mapping = DIFFICULTY_WEEK_MAP.find(m => week >= m.weeksStart && week <= m.weeksEnd)
    if (!mapping) return null
    const pool = setsByDifficulty[mapping.difficulty]
    if (pool.length === 0) return null
    const set = pool[setCounters[mapping.difficulty] % pool.length]
    setCounters[mapping.difficulty]++
    return set
  }

  const rotation = ROTATIONS[examType]
  const tasks: Partial<IDailyTask>[] = []

  for (let day = 0; day < 90; day++) {
    const date = addDays(start, day)
    const dayOfWeek = date.getDay() // 0=Sun, 1=Mon ... 6=Sat
    // Map to rotation index: Mon=0 ... Sun=6
    const rotIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const template = rotation[rotIdx]
    const dayNumber = day + 1
    const weekNumber = Math.ceil(dayNumber / 7)

    let actualTemplate = { ...template }

    // Sunday logic: mock test every 2 weeks, else revision
    if (rotIdx === 6) {
      if (weekNumber % 2 !== 0) {
        // odd weeks → revision
        actualTemplate = {
          skillFocus: 'Reading',
          taskType: 'revision',
          durationMins: 60,
        }
      }
    }

    const title = getTaskTitle(actualTemplate, examType)

    // Assign exam set to mock_test tasks
    const isMockTest = actualTemplate.taskType === 'mock_test'
    const assignedSet = isMockTest ? pickExamSet(weekNumber) : null

    tasks.push({
      userId,
      scheduledDate: date.toISOString(),
      dayNumber,
      weekNumber,
      title,
      description: '',
      skillFocus: actualTemplate.skillFocus,
      taskType: actualTemplate.taskType,
      durationMins: actualTemplate.durationMins,
      durationMinutes: actualTemplate.durationMins,
      subject: actualTemplate.skillFocus,
      completed: false,
      completedAt: null,
      gcalEventId: null,
      notes: '',
      ...(assignedSet ? { examSetId: assignedSet._id, examSetName: assignedSet.name } : {}),
    })
  }

  const milestones: Partial<IMilestone>[] = MILESTONE_TEMPLATES.map((m) => ({
    userId,
    title: m.title,
    description: m.description,
    weekNumber: m.week,
    targetDate: addDays(start, m.week * 7 - 1).toISOString(),
    achieved: false,
    achievedAt: null,
  }))

  return { plan, tasks, milestones }
}
