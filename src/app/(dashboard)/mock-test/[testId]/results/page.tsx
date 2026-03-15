'use client'

import { use } from 'react'
import Link from 'next/link'
import { Trophy, ArrowLeft, BookOpen, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react'
import { useMockTestDetail } from '@/hooks/useMockTest'
import { selectLastResult } from '@/store/slices/mockTestSlice'
import { useAppSelector } from '@/store/hooks'
import { QuestionReviewTable } from '@/components/mock-test/QuestionReviewTable'
import type { IMockTestQuestion, IQuestionFull } from '@/types/mockTest'
import { cn } from '@/lib/utils'

type ReviewRow = IMockTestQuestion & { questionDetail?: IQuestionFull }

function scrollToReview() {
  document.getElementById('review-section')?.scrollIntoView({ behavior: 'smooth' })
}

function ScoreSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="h-16 w-32 rounded-xl bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-20 rounded-full bg-muted" />
        </div>
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-5 w-28 rounded bg-muted" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function MockTestResultsPage({
  params,
}: {
  params: Promise<{ testId: string }>
}) {
  const { testId } = use(params)

  const { test, questions, result: fetchedResult, isLoading } = useMockTestDetail(testId)
  const reduxResult = useAppSelector(selectLastResult)

  // Use fetched result first; fall back to Redux store result (set right after submission)
  const result = fetchedResult ?? (reduxResult?.testId === testId ? reduxResult : null)

  // Build the review rows by merging IMockTestQuestion entries with their full question details
  const reviewRows: ReviewRow[] = (test?.questions ?? []).map(eq => {
    const detail = questions.find(q => q._id === eq.questionId)
    return { ...eq, questionDetail: detail }
  })


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top bar skeleton */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-9 w-36 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <main className="mx-auto max-w-5xl px-4 py-12">
          <ScoreSkeleton />
        </main>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Result not found</h1>
        <p className="text-muted-foreground text-center max-w-sm">
          We could not load the result for this test. It may have been cleared or the test ID is
          incorrect.
        </p>
        <Link
          href="/mock-test"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tests
        </Link>
      </div>
    )
  }

  const {
    scaledScore,
    examType,
    testMode,
    correctAnswers,
    totalQuestions,
    timeTakenMins,
    sectionScores,
    weakAreas,
    strongAreas,
    recommendations,
  } = result

  const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  function sectionColor(pct: number) {
    if (pct >= 70) return { bar: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bg: 'bg-green-50' }
    if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' }
    return { bar: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' }
  }

  function overallScoreColor(pct: number) {
    if (pct >= 70) return 'text-green-600'
    if (pct >= 50) return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/mock-test"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tests
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/mock-test/${testId}/review`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              Review Answers
            </Link>
            <button
              onClick={scrollToReview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Summary
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        {/* ── Hero section ── */}
        <section className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <Trophy className="h-10 w-10 text-amber-500" />
          </div>

          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Scaled Score
            </p>
            <p
              className={cn(
                'text-7xl font-extrabold leading-none tracking-tight',
                overallScoreColor(percentage),
              )}
            >
              {scaledScore}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {examType}
            </span>
            <span className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
              {testMode} mode
            </span>
          </div>

          <p className="text-xl font-semibold text-foreground">
            {correctAnswers} / {totalQuestions} correct
          </p>

          <p className={cn('text-lg font-medium', overallScoreColor(percentage))}>
            {percentage}% accuracy
          </p>

          <p className="text-sm text-muted-foreground">
            Time taken:&nbsp;
            <span className="font-medium text-foreground">{timeTakenMins} min</span>
          </p>
        </section>

        {/* ── Section scores ── */}
        {sectionScores.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Section Scores</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sectionScores.map(sec => {
                const colors = sectionColor(sec.percentage)
                return (
                  <div
                    key={sec.section}
                    className={cn(
                      'rounded-2xl border p-5 space-y-3',
                      colors.border,
                      colors.bg,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold capitalize text-foreground">{sec.section}</p>
                      <p className={cn('text-sm font-bold', colors.text)}>
                        {sec.score} / {sec.maxScore}
                      </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
                      <div
                        className={cn('h-full rounded-full transition-all', colors.bar)}
                        style={{ width: `${sec.percentage}%` }}
                      />
                    </div>
                    <p className={cn('text-xs font-medium', colors.text)}>{sec.percentage}%</p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Weak areas + Recommendations ── */}
        {weakAreas.length > 0 && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-red-700">Areas to Improve</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {weakAreas.map(area => (
                <span
                  key={area}
                  className="rounded-full bg-red-100 border border-red-300 px-3 py-1 text-xs font-medium text-red-700"
                >
                  {area}
                </span>
              ))}
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-red-700">Recommendations</p>
                <ul className="space-y-1.5">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ── Strong areas ── */}
        {strongAreas.length > 0 && (
          <section className="rounded-2xl border border-green-200 bg-green-50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-green-700">Strong Areas</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {strongAreas.map(area => (
                <span
                  key={area}
                  className="rounded-full bg-green-100 border border-green-300 px-3 py-1 text-xs font-medium text-green-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* ── Question review table ── */}
        <div id="review-section" className="space-y-4 scroll-mt-20">
          <h2 className="text-lg font-semibold text-foreground">Question Review</h2>
          <QuestionReviewTable questions={reviewRows} />
        </div>

        {/* ── Action buttons ── */}
        <section className="flex flex-wrap items-center justify-center gap-3 pt-4 pb-12">
          <Link
            href={`/mock-test/${testId}/review`}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <BookOpen className="h-4 w-4" />
            Review Answers
          </Link>
          <Link
            href="/mock-test"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Start New Test
          </Link>
          <Link
            href="/study-plan"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            View Study Plan
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Dashboard
          </Link>
        </section>
      </main>
    </div>
  )
}
