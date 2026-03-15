'use client'

import { use, useCallback, useEffect, useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  BookOpen,
  Clock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import {
  selectActiveTest,
  setCurrentQuestion,
  saveAnswer as saveAnswerAction,
  tickTimer,
  flagQuestion,
} from '@/store/slices/mockTestSlice'

import {
  useMockTestDetail,
  useSubmitAnswer,
  useSubmitTest,
  useAbandonTest,
} from '@/hooks/useMockTest'

import { Timer } from '@/components/mock-test/Timer'
import { MultipleChoice } from '@/components/mock-test/MultipleChoice'
import { TrueFalse } from '@/components/mock-test/TrueFalse'
import { FillBlank } from '@/components/mock-test/FillBlank'
import { WordOrder } from '@/components/mock-test/WordOrder'
import { GridIn } from '@/components/mock-test/GridIn'
import { Essay } from '@/components/mock-test/Essay'
import { cn } from '@/lib/utils'

import type { IQuestionFull } from '@/types/mockTest'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ testId: string }>
}

// ---------------------------------------------------------------------------
// Matching table (no dedicated component exists — inline here)
// ---------------------------------------------------------------------------

function MatchingQuestion({
  question,
  answer,
  onAnswer,
  isSubmitted,
}: {
  question: IQuestionFull
  answer: string[] | null
  onAnswer: (a: string[]) => void
  isSubmitted: boolean
}) {
  const pairs = question.matchingPairs ?? []
  // Shuffled right-side options shown in dropdowns
  const rightOptions = useMemo(
    () => [...pairs.map(p => p.right)].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question._id],
  )

  // answer is stored as ["right0", "right1", ...] indexed by left item position
  const selections: string[] = answer ?? Array(pairs.length).fill('')

  const handleSelect = (idx: number, value: string) => {
    const updated = [...selections]
    updated[idx] = value
    onAnswer(updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/2">Item</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/2">Match</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => {
              const selected = selections[i] ?? ''
              const isCorrect = isSubmitted && selected === pair.right
              const isWrong = isSubmitted && selected !== pair.right
              return (
                <tr key={i} className={cn('border-t border-border', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  <td className="px-4 py-3 font-medium">{pair.left}</td>
                  <td className="px-4 py-3">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2">
                        <span className={cn('font-medium', isCorrect && 'text-green-600', isWrong && 'text-red-500')}>
                          {selected || '—'}
                        </span>
                        {isWrong && <span className="text-xs text-muted-foreground">→ {pair.right}</span>}
                      </div>
                    ) : (
                      <select
                        value={selected}
                        onChange={e => handleSelect(i, e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select…</option>
                        {rightOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {isSubmitted && question.explanation && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            Explanation
          </p>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {question.explanation}
          </p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Question renderer
// ---------------------------------------------------------------------------

function QuestionRenderer({
  question,
  answer,
  onAnswer,
  isSubmitted,
  showExplanation,
}: {
  question: IQuestionFull
  answer: string | string[] | null
  onAnswer: (a: string | string[]) => void
  isSubmitted: boolean
  showExplanation: boolean
}) {
  const type = question.questionType

  const strAnswer = typeof answer === 'string' ? answer : null
  const arrAnswer = Array.isArray(answer) ? answer : []

  if (type === 'multiple_choice' || type === 'multiple-choice') {
    return (
      <MultipleChoice
        question={question}
        selectedAnswer={strAnswer}
        onAnswer={onAnswer as (a: string) => void}
        isSubmitted={isSubmitted}
        showExplanation={showExplanation}
      />
    )
  }

  if (type === 'true_false_ng' || type === 'true-false') {
    return (
      <TrueFalse
        question={question}
        selectedAnswer={strAnswer}
        onAnswer={onAnswer as (a: string) => void}
        isSubmitted={isSubmitted}
        showExplanation={showExplanation}
      />
    )
  }

  if (type === 'fill_blank' || type === 'fill-blank') {
    return (
      <FillBlank
        question={question}
        answers={arrAnswer}
        onAnswer={onAnswer as (a: string[]) => void}
        isSubmitted={isSubmitted}
        showExplanation={showExplanation}
      />
    )
  }

  if (type === 'word_order' || type === 'word-order') {
    return (
      <WordOrder
        question={question}
        currentOrder={arrAnswer}
        onAnswer={onAnswer as (a: string[]) => void}
        isSubmitted={isSubmitted}
        showExplanation={showExplanation}
      />
    )
  }

  if (type === 'grid_in' || type === 'grid-in') {
    return (
      <GridIn
        question={question}
        answer={strAnswer ?? ''}
        onAnswer={onAnswer as (a: string) => void}
        isSubmitted={isSubmitted}
        showExplanation={showExplanation}
      />
    )
  }

  if (type === 'essay') {
    return (
      <Essay
        question={question}
        answer={strAnswer ?? ''}
        onAnswer={onAnswer as (a: string) => void}
        isSubmitted={isSubmitted}
      />
    )
  }

  if (type === 'matching') {
    return (
      <MatchingQuestion
        question={question}
        answer={Array.isArray(answer) ? answer : null}
        onAnswer={onAnswer as (a: string[]) => void}
        isSubmitted={isSubmitted}
      />
    )
  }

  // Fallback for unknown types
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6">
      <p className="text-sm text-muted-foreground">
        Unknown question type: <strong>{type}</strong>
      </p>
      <p className="mt-2 text-base font-medium">{question.question}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Question Navigator Button
// ---------------------------------------------------------------------------

function NavButton({
  index,
  current,
  answered,
  flagged,
  onClick,
}: {
  index: number
  current: boolean
  answered: boolean
  flagged: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-9 w-9 rounded-lg text-sm font-semibold transition-all',
        'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        current &&
          'ring-2 ring-primary ring-offset-1 border-primary bg-primary text-primary-foreground',
        !current &&
          flagged &&
          'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
        !current &&
          !flagged &&
          answered &&
          'border-primary/60 bg-primary/10 text-primary',
        !current &&
          !flagged &&
          !answered &&
          'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50',
      )}
    >
      {index + 1}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function PageSkeleton() {
  return (
    <div className="flex h-screen flex-col">
      {/* Top bar skeleton */}
      <div className="flex h-14 items-center gap-4 border-b border-border bg-background px-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <div className="ml-auto flex items-center gap-3">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="hidden w-56 shrink-0 border-r border-border bg-muted/20 p-4 lg:block">
          <Skeleton className="mb-3 h-4 w-24" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-9 rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <main className="flex-1 overflow-y-auto p-6">
          <Skeleton className="mb-6 h-5 w-40" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
          <div className="mt-8 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function MockTestPage({ params }: Props) {
  const { testId } = use(params)

  const dispatch = useAppDispatch()
  useRouter() // consumed by hooks internally

  // Redux active test (source of truth for timer / answers during live session)
  const activeTest = useAppSelector(selectActiveTest)

  // API data (used as fallback / for review mode)
  const { test, questions, isLoading } = useMockTestDetail(testId)

  // Hooks
  const { submitAnswer } = useSubmitAnswer()
  const { submitTest, isPending: isSubmitting } = useSubmitTest()
  const { abandonTest, isPending: isAbandoning } = useAbandonTest()

  // Derived: which question list to use
  const questionList: IQuestionFull[] = activeTest?.questions ?? questions

  // Local state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [abandonDialogOpen, setAbandonDialogOpen] = useState(false)

  // Sync currentIndex from Redux when activeTest is present
  useEffect(() => {
    if (activeTest) {
      setCurrentIndex(activeTest.currentQuestionIndex)
    }
  }, [activeTest])

  // Initialise answers from Redux activeTest on mount
  useEffect(() => {
    if (activeTest) {
      const hydrated: Record<string, string | string[]> = {}
      for (const [qId, rec] of Object.entries(activeTest.answers)) {
        if (rec.userAnswer !== null) {
          hydrated[qId] = rec.userAnswer
        }
      }
      setAnswers(hydrated)
    }
  // Only run once on mount / when testId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  // ---------------------------------------------------------------------------
  // Timer tick — only in live mode
  // ---------------------------------------------------------------------------

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isReviewMode = test?.status === 'completed'
  const isLive = !!activeTest && !isReviewMode

  useEffect(() => {
    if (!isLive) return

    timerRef.current = setInterval(() => {
      dispatch(tickTimer())
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLive, dispatch])

  // Auto-submit when time runs out
  useEffect(() => {
    if (isLive && activeTest && activeTest.timeRemainingSeconds === 0) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTest?.timeRemainingSeconds, isLive])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const navigateTo = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      dispatch(setCurrentQuestion(index))
    },
    [dispatch],
  )

  // Debounce timer for text-input question types
  const submitDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Question types where the user types — debounce API submission
  const TEXT_INPUT_TYPES = useMemo(() => new Set(['fill_blank', 'fill-blank', 'grid_in', 'grid-in', 'essay']), [])

  const handleAnswer = useCallback(
    (answer: string | string[]) => {
      const q = questionList[currentIndex]
      if (!q) return

      // Update local state and Redux immediately (UI stays responsive)
      setAnswers((prev) => ({ ...prev, [q._id]: answer }))
      dispatch(
        saveAnswerAction({
          questionId: q._id,
          answer,
          isCorrect: null,
          flagged: activeTest?.answers[q._id]?.flagged ?? false,
          timeSpentSecs: 0,
        }),
      )

      // For text-input types, debounce the API call so partial keystrokes aren't saved
      if (TEXT_INPUT_TYPES.has(q.questionType)) {
        if (submitDebounceRef.current) clearTimeout(submitDebounceRef.current)
        submitDebounceRef.current = setTimeout(() => {
          submitAnswer({
            testId,
            questionId: q._id,
            userAnswer: answer,
            timeSpentSecs: 0,
            flagged: activeTest?.answers[q._id]?.flagged ?? false,
          })
        }, 800)
      } else {
        // Instant save for selection types (multiple choice, true/false, word order)
        submitAnswer({
          testId,
          questionId: q._id,
          userAnswer: answer,
          timeSpentSecs: 0,
          flagged: activeTest?.answers[q._id]?.flagged ?? false,
        })
      }
    },
    [questionList, currentIndex, testId, activeTest, dispatch, submitAnswer, TEXT_INPUT_TYPES],
  )

  const handleFlag = useCallback(() => {
    const q = questionList[currentIndex]
    if (!q) return
    dispatch(flagQuestion(q._id))
  }, [questionList, currentIndex, dispatch])

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    submitTest(testId)
  }, [submitTest, testId])

  const handleAbandon = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    abandonTest(testId)
  }, [abandonTest, testId])

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const totalQuestions = questionList.length
  const currentQuestion = questionList[currentIndex] ?? null

  const unansweredCount = questionList.filter((q) => {
    const a = answers[q._id]
    if (a === undefined || a === null) return true
    if (typeof a === 'string') return a.trim() === ''
    return a.length === 0
  }).length

  const isFlagged = currentQuestion
    ? (activeTest?.answers[currentQuestion._id]?.flagged ?? false)
    : false

  const currentAnswer = currentQuestion ? (answers[currentQuestion._id] ?? null) : null

  const timeRemaining =
    activeTest?.timeRemainingSeconds ?? (test ? test.timeLimitMins * 60 : 0)
  const totalMins = activeTest?.timeLimitMins ?? test?.timeLimitMins ?? 60

  const examName = activeTest?.examType ?? test?.examType ?? ''
  const section = activeTest?.section ?? test?.section ?? ''
  const examSetName = activeTest?.examSetName ?? (test as typeof test & { examSetName?: string | null })?.examSetName ?? null

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading && !activeTest) {
    return <PageSkeleton />
  }

  if (!isLoading && !test && !activeTest) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">Test not found</p>
        <Link href="/mock-test" className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-8 text-sm font-medium hover:bg-muted transition-colors">Back to Mock Tests</Link>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ------------------------------------------------------------------ */}
        {/* Sticky Top Bar                                                       */}
        {/* ------------------------------------------------------------------ */}
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4">
          {/* Exam badge */}
          <Badge variant="secondary" className="shrink-0 text-xs font-bold uppercase tracking-wide">
            {examName}
          </Badge>

          {/* Exam set name or section */}
          {(examSetName || section) && (
            <>
              <Separator orientation="vertical" className="h-5" />
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline max-w-[180px] truncate">
                {examSetName ?? section}
              </span>
            </>
          )}

          {/* Progress */}
          <Separator orientation="vertical" className="h-5" />
          <span className="text-sm font-semibold tabular-nums">
            Q {currentIndex + 1}
            <span className="font-normal text-muted-foreground">/{totalQuestions}</span>
          </span>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Timer */}
            {isLive && (
              <Timer
                timeRemainingSeconds={timeRemaining}
                totalMins={totalMins}
                onExpire={handleSubmit}
              />
            )}

            {isReviewMode && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Review Mode</span>
              </div>
            )}

            {/* Abandon */}
            {isLive && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground hover:text-destructive sm:flex"
                onClick={() => setAbandonDialogOpen(true)}
              >
                <X className="mr-1 h-4 w-4" />
                Abandon
              </Button>
            )}

            {/* Submit */}
            {!isReviewMode && (
              <Button
                size="sm"
                onClick={() => setSubmitDialogOpen(true)}
                disabled={isSubmitting || isAbandoning}
              >
                <Send className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Submit</span>
              </Button>
            )}

            {isReviewMode && (
              <Link href="/mock-test" className="inline-flex items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium hover:bg-muted transition-colors">
                <X className="mr-1 h-3.5 w-3.5" />
                Close
              </Link>
            )}
          </div>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* Body                                                                  */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-1 overflow-hidden">
          {/* ---------------------------------------------------------------- */}
          {/* Left Sidebar — Question Navigator (desktop only)                  */}
          {/* ---------------------------------------------------------------- */}
          <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-muted/20 lg:flex">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Questions
              </span>
              <span className="text-xs text-muted-foreground">
                {totalQuestions - unansweredCount}/{totalQuestions}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-5 gap-2">
                {questionList.map((q, i) => {
                  const ans = answers[q._id]
                  const hasAnswer =
                    ans !== undefined &&
                    ans !== null &&
                    (typeof ans === 'string' ? ans.trim() !== '' : ans.length > 0)
                  const isFlaggedQ = activeTest?.answers[q._id]?.flagged ?? false

                  return (
                    <NavButton
                      key={q._id}
                      index={i}
                      current={i === currentIndex}
                      answered={hasAnswer}
                      flagged={isFlaggedQ}
                      onClick={() => navigateTo(i)}
                    />
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-primary/60 bg-primary/10" />
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-amber-400 bg-amber-50" />
                  Flagged
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-border bg-background" />
                  Unanswered
                </div>
              </div>
            </div>
          </aside>

          {/* ---------------------------------------------------------------- */}
          {/* Main Content                                                       */}
          {/* ---------------------------------------------------------------- */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-6 p-6">
                {/* Question number + difficulty badge */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Question {currentIndex + 1}
                  </span>
                  {currentQuestion?.difficulty && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        currentQuestion.difficulty === 'easy' &&
                          'border-green-400 text-green-600',
                        currentQuestion.difficulty === 'medium' &&
                          'border-amber-400 text-amber-600',
                        currentQuestion.difficulty === 'hard' &&
                          'border-red-400 text-red-600',
                      )}
                    >
                      {currentQuestion.difficulty}
                    </Badge>
                  )}
                  {currentQuestion?.points !== undefined && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {currentQuestion.points}{' '}
                      {currentQuestion.points === 1 ? 'pt' : 'pts'}
                    </span>
                  )}
                </div>

                {/* Passage */}
                {currentQuestion?.passage && currentQuestion.questionType !== 'essay' && (
                  <div className="rounded-xl border border-border bg-muted/30 p-5">
                    <div className="mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Passage
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.passage}
                      </p>
                    </div>
                  </div>
                )}

                {/* Question Component */}
                {currentQuestion ? (
                  <QuestionRenderer
                    question={currentQuestion}
                    answer={currentAnswer}
                    onAnswer={isReviewMode ? () => {} : handleAnswer}
                    isSubmitted={isReviewMode}
                    showExplanation={isReviewMode}
                  />
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-8 text-center text-muted-foreground">
                    No question available.
                  </div>
                )}

                {/* Review: correct / incorrect indicator */}
                {isReviewMode && currentQuestion && (() => {
                  const qRecord = test?.questions.find(
                    (q) => q.questionId === currentQuestion._id,
                  )
                  if (!qRecord) return null
                  const correct = qRecord.isCorrect
                  if (correct === null) return null
                  return (
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium',
                        correct
                          ? 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                          : 'border-red-400 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
                      )}
                    >
                      {correct ? '✓ Correct' : '✗ Incorrect'}
                      <span className="ml-auto font-normal text-xs">
                        {qRecord.pointsEarned ?? 0}/{currentQuestion.points ?? 1} pts
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* Footer — Prev / Flag / Next                                      */}
            {/* -------------------------------------------------------------- */}
            <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
              <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => navigateTo(currentIndex - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {/* Mobile question counter */}
                  <span className="text-xs text-muted-foreground lg:hidden">
                    {currentIndex + 1} / {totalQuestions}
                  </span>

                  {/* Flag button — only in live mode */}
                  {!isReviewMode && (
                    <Button
                      variant={isFlagged ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleFlag}
                      className={cn(
                        isFlagged &&
                          'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white',
                      )}
                    >
                      <Flag className="mr-1 h-4 w-4" />
                      {isFlagged ? 'Flagged' : 'Flag'}
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === totalQuestions - 1}
                  onClick={() => navigateTo(currentIndex + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Submit AlertDialog                                                      */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              {unansweredCount > 0 ? (
                <>
                  You have{' '}
                  <strong className="text-foreground">
                    {unansweredCount} unanswered{' '}
                    {unansweredCount === 1 ? 'question' : 'questions'}
                  </strong>
                  {'. '}Unanswered questions will be marked as incorrect.{' '}
                </>
              ) : (
                <>You have answered all {totalQuestions} questions. </>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* -------------------------------------------------------------------- */}
      {/* Abandon AlertDialog                                                     */}
      {/* -------------------------------------------------------------------- */}
      <AlertDialog open={abandonDialogOpen} onOpenChange={setAbandonDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abandon Test?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost and this test will be marked as abandoned. Are
              you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isAbandoning}>Keep Testing</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAbandon}
              disabled={isAbandoning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isAbandoning ? 'Abandoning…' : 'Abandon Test'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
