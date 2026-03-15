'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  BookOpen, Target, Zap, ChevronRight, AlertCircle,
  Clock, Hash, CalendarDays, Layers, Play,
} from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { selectActiveTest } from '@/store/slices/mockTestSlice'
import { useStartMockTest, useMockTestHistory } from '@/hooks/useMockTest'
import { useExamSets } from '@/hooks/useExamSets'
import { useSelectedPlan } from '@/hooks/useStudyPlan'
import { TEST_CONFIG } from '@/constants/questionTypes'
import type { ExamTypeKey, TestMode } from '@/constants/questionTypes'
import { TestHistoryTable } from '@/components/mock-test/TestHistoryTable'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const EXAM_TYPES = ['IELTS', 'TOEFL', 'JLPT', 'SAT'] as const

interface TestModeCard {
  mode: TestMode
  label: string
  description: string
  icon: React.ElementType
  getTimeMins: (cfg: (typeof TEST_CONFIG)[ExamTypeKey] | undefined) => number
  getQuestions: (cfg: (typeof TEST_CONFIG)[ExamTypeKey] | undefined) => number
}

const TEST_MODE_CARDS: TestModeCard[] = [
  {
    mode: 'full',
    label: 'Full Test',
    description: 'Complete exam simulation',
    icon: BookOpen,
    getTimeMins: (cfg) => cfg?.full.timeMins ?? 60,
    getQuestions: (cfg) => cfg?.full.questions ?? 40,
  },
  {
    mode: 'section',
    label: 'Section Practice',
    description: 'Focus on one section',
    icon: Target,
    getTimeMins: (cfg) => cfg?.section.timeMins ?? 20,
    getQuestions: (cfg) => cfg?.section.questions ?? 10,
  },
  {
    mode: 'drill',
    label: 'Drill Mode',
    description: 'Quick targeted practice',
    icon: Zap,
    getTimeMins: (_cfg) => 15,
    getQuestions: (cfg) => cfg?.drill.questions ?? 10,
  },
]

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-700 bg-green-100',
  medium: 'text-yellow-700 bg-yellow-100',
  hard: 'text-red-700 bg-red-100',
}

// ─── Types ────────────────────────────────────────────────────────────────

interface ScheduledTask {
  _id: string
  title: string
  scheduledDate: string
  durationMins: number
  completed: boolean
  examSetId: string | null
  examSetName: string | null
}

// ─── Hooks ────────────────────────────────────────────────────────────────

function useScheduledMockTasks(planId?: string) {
  return useQuery({
    queryKey: ['daily-tasks', 'mock-test', planId],
    queryFn: async () => {
      if (!planId) return []
      const today = new Date()
      const twoWeeks = new Date(today)
      twoWeeks.setDate(today.getDate() + 14)
      const res = await axios.get('/api/daily-tasks', {
        params: {
          planId,
          taskType: 'mock_test',
          from: today.toISOString().split('T')[0],
          to: twoWeeks.toISOString().split('T')[0],
        },
      })
      return (res.data.data ?? []) as ScheduledTask[]
    },
    enabled: !!planId,
  })
}

// ─── Scheduled Tests Section ─────────────────────────────────────────────

function ScheduledTestsSection() {
  const { selectedPlan } = useSelectedPlan()
  const { startTest, isPending } = useStartMockTest()
  const { data: upcomingTasks = [], isLoading } = useScheduledMockTasks(selectedPlan?._id)

  if (!selectedPlan) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Scheduled Tests
        </h2>
        <p className="text-sm text-muted-foreground">Assigned mock tests from your study plan.</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : upcomingTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No scheduled mock tests in the next two weeks.
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingTasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{task.title}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(task.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </span>
                  {task.examSetName && (
                    <>
                      <span>·</span>
                      <span>{task.examSetName}</span>
                    </>
                  )}
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{task.durationMins} min</span>
                </div>
              </div>
              <Button
                size="sm"
                disabled={isPending || task.completed}
                onClick={() =>
                  startTest({
                    examType: selectedPlan.examType,
                    testMode: 'full',
                    taskId: task._id,
                    examSetId: task.examSetId ?? undefined,
                    isScheduled: true,
                  })
                }
              >
                {task.completed ? 'Done' : <><Play className="h-3.5 w-3.5 mr-1" />Start</>}
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Practice Sets Section ────────────────────────────────────────────────

function PracticeSetsSection() {
  const { selectedPlan } = useSelectedPlan()
  const examType = selectedPlan?.examType
  const { examSets, isLoading } = useExamSets({ examType })
  const { startTest, isPending } = useStartMockTest()

  if (!examType) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Practice Sets
        </h2>
        <p className="text-sm text-muted-foreground">Published exam sets available for free practice.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : examSets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          No practice sets available for {examType} yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {examSets.map((set) => (
            <div key={set._id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <p className="font-medium text-sm leading-tight">{set.name}</p>
                <Badge className={cn('text-xs ml-2 shrink-0', DIFFICULTY_COLORS[set.difficulty])}>
                  {set.difficulty}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{set.description}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{set.totalQuestions}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{set.timeLimitMins} min</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                disabled={isPending}
                onClick={() => startTest({ examType, testMode: 'full', examSetId: set._id, isScheduled: false })}
              >
                <Play className="h-3.5 w-3.5 mr-1" /> Start Practice
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Extra Practice Section ───────────────────────────────────────────────

function ExtraPracticeSection() {
  const [examType, setExamType] = useState<string>('')
  const [testMode, setTestMode] = useState<TestMode>('full')
  const [section, setSection] = useState<string>('')
  const [includeCustom, setIncludeCustom] = useState<boolean>(false)
  const { startTest, isPending, error } = useStartMockTest()

  const examConfig = examType ? TEST_CONFIG[examType as ExamTypeKey] : undefined
  const availableSections: readonly string[] = examConfig?.sections ?? []
  const needsSection = testMode === 'section' || testMode === 'drill'
  const isStartDisabled = !examType || (needsSection && !section) || isPending

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Extra Practice
        </h2>
        <p className="text-sm text-muted-foreground">Random question pool — any exam, any mode.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {TEST_MODE_CARDS.map(({ mode, label, description, icon: Icon, getTimeMins, getQuestions }) => {
          const isSelected = testMode === mode
          return (
            <button
              key={mode}
              type="button"
              onClick={() => { setTestMode(mode); if (mode === 'full') setSection('') }}
              className={cn(
                'group flex flex-col gap-3 rounded-2xl border bg-card p-4 text-left transition-all hover:shadow-md',
                isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50',
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                {isSelected && <Badge variant="default" className="text-xs">Selected</Badge>}
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
              <div className="flex items-center gap-3 mt-auto">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{getTimeMins(examConfig)} mins
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3" />{getQuestions(examConfig)} q
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configure</CardTitle>
          <CardDescription>Choose exam and options, then start.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Exam Type</Label>
            <Select value={examType} onValueChange={v => { setExamType(v ?? ''); setSection('') }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an exam…" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_TYPES.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {needsSection && (
            <div className="space-y-1.5">
              <Label>Section</Label>
              <Select value={section} onValueChange={v => setSection(v ?? '')} disabled={!examType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={examType ? 'Select a section…' : 'Select exam first'} />
                </SelectTrigger>
                <SelectContent>
                  {availableSections.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="space-y-0.5">
              <Label htmlFor="include-custom" className="text-sm font-medium cursor-pointer">
                Include Custom Questions
              </Label>
              <p className="text-xs text-muted-foreground">Mix in your own questions.</p>
            </div>
            <Switch id="include-custom" checked={includeCustom} onCheckedChange={setIncludeCustom} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span>
            </div>
          )}

          <Button
            className="w-full" size="lg"
            disabled={isStartDisabled}
            onClick={() => {
              if (!examType) return
              startTest({
                examType, testMode,
                section: needsSection ? section : undefined,
                includeCustomQuestions: includeCustom,
                isScheduled: false,
              })
            }}
          >
            {isPending
              ? 'Starting…'
              : <span className="flex items-center gap-2">Start Test <ChevronRight className="h-4 w-4" /></span>}
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}

// ─── Plan Switcher ─────────────────────────────────────────────────────────

function PlanSwitcher() {
  const { plans, selectedPlan, selectPlan, isLoading } = useSelectedPlan()
  if (isLoading || plans.length <= 1) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <span className="text-sm font-medium text-muted-foreground shrink-0">Viewing for:</span>
      <div className="flex flex-wrap gap-2">
        {plans.map(p => (
          <button
            key={p._id}
            onClick={() => selectPlan(p._id)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors border',
              selectedPlan?._id === p._id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-muted'
            )}
          >
            {p.examType}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function MockTestPage() {
  const activeTest = useAppSelector(selectActiveTest)
  const { tests, isLoading: historyLoading } = useMockTestHistory()

  return (
    <div className="space-y-10 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mock Tests</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Simulate real exam conditions with timed, full-length practice tests or targeted drills.
        </p>
      </div>

      <PlanSwitcher />

      {activeTest && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="flex-1 text-sm text-amber-800 dark:text-amber-300">You have a test in progress</p>
          <Link
            href={`/mock-test/${activeTest.testId}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 underline-offset-2 hover:underline dark:text-amber-300"
          >
            Resume Test <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <ScheduledTestsSection />
      <PracticeSetsSection />
      <ExtraPracticeSection />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Recent Tests</h2>
          <p className="text-sm text-muted-foreground">Your test history and scores at a glance.</p>
        </div>
        {historyLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BookOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-sm">No tests yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Complete your first mock test to see history here.</p>
            </div>
          </div>
        ) : (
          <TestHistoryTable tests={tests} />
        )}
      </section>
    </div>
  )
}
