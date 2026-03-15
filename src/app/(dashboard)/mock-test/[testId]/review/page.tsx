'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, XCircle, MinusCircle, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMockTestDetail } from '@/hooks/useMockTest'
import { MultipleChoice } from '@/components/mock-test/MultipleChoice'
import { TrueFalse } from '@/components/mock-test/TrueFalse'
import { FillBlank } from '@/components/mock-test/FillBlank'
import { WordOrder } from '@/components/mock-test/WordOrder'
import { GridIn } from '@/components/mock-test/GridIn'
import { Essay } from '@/components/mock-test/Essay'
import type { IQuestionFull, IMockTestQuestion } from '@/types/mockTest'

// ---------------------------------------------------------------------------
// Matching — read-only review version
// ---------------------------------------------------------------------------

function MatchingReview({ question, answer }: { question: IQuestionFull; answer: string[] | null }) {
  const pairs = question.matchingPairs ?? []
  const selections: string[] = answer ?? []

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/3">Item</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/3">Your Answer</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-1/3">Correct</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, i) => {
              const selected = selections[i] ?? ''
              const isCorrect = selected === pair.right
              return (
                <tr key={i} className={cn('border-t border-border', i % 2 === 0 ? 'bg-background' : 'bg-muted/20')}>
                  <td className="px-4 py-3 font-medium">{pair.left}</td>
                  <td className="px-4 py-3">
                    <span className={cn('font-medium', isCorrect ? 'text-green-600' : 'text-red-500')}>
                      {selected || <span className="text-muted-foreground italic">No answer</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-green-700 font-medium">{pair.right}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {question.explanation && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Explanation</p>
          <p className="text-sm text-amber-800 dark:text-amber-300">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Question renderer (review / read-only mode)
// ---------------------------------------------------------------------------

function ReviewRenderer({
  question,
  answer,
}: {
  question: IQuestionFull
  answer: string | string[] | null
}) {
  const type = question.questionType
  const strAnswer = typeof answer === 'string' ? answer : null
  const arrAnswer = Array.isArray(answer) ? answer : []
  const noop = () => {}

  if (type === 'multiple_choice' || type === 'multiple-choice') {
    return (
      <MultipleChoice
        question={question}
        selectedAnswer={strAnswer}
        onAnswer={noop as (a: string) => void}
        isSubmitted
        showExplanation
      />
    )
  }

  if (type === 'true_false_ng' || type === 'true-false') {
    return (
      <TrueFalse
        question={question}
        selectedAnswer={strAnswer}
        onAnswer={noop as (a: string) => void}
        isSubmitted
        showExplanation
      />
    )
  }

  if (type === 'fill_blank' || type === 'fill-blank') {
    return (
      <FillBlank
        question={question}
        answers={arrAnswer}
        onAnswer={noop as (a: string[]) => void}
        isSubmitted
        showExplanation
      />
    )
  }

  if (type === 'word_order' || type === 'word-order') {
    return (
      <WordOrder
        question={question}
        currentOrder={arrAnswer}
        onAnswer={noop as (a: string[]) => void}
        isSubmitted
        showExplanation
      />
    )
  }

  if (type === 'grid_in' || type === 'grid-in') {
    return (
      <GridIn
        question={question}
        answer={strAnswer ?? ''}
        onAnswer={noop as (a: string) => void}
        isSubmitted
        showExplanation
      />
    )
  }

  if (type === 'essay') {
    return (
      <Essay
        question={question}
        answer={strAnswer ?? ''}
        onAnswer={noop as (a: string) => void}
        isSubmitted
      />
    )
  }

  if (type === 'matching') {
    return (
      <MatchingReview
        question={question}
        answer={Array.isArray(answer) ? answer : null}
      />
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-6">
      <p className="text-sm text-muted-foreground">Unknown type: <strong>{type}</strong></p>
      <p className="mt-2 text-base font-medium">{question.question}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Result badge
// ---------------------------------------------------------------------------

function ResultBadge({ isCorrect }: { isCorrect: boolean | null }) {
  if (isCorrect === true) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-950/40 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-green-400">
      <CheckCircle className="h-3.5 w-3.5" /> Correct
    </span>
  )
  if (isCorrect === false) return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/40 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400">
      <XCircle className="h-3.5 w-3.5" /> Wrong
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
      <MinusCircle className="h-3.5 w-3.5" /> Essay
    </span>
  )
}

// ---------------------------------------------------------------------------
// Nav dot
// ---------------------------------------------------------------------------

function NavDot({
  index,
  current,
  isCorrect,
  flagged,
  onClick,
}: {
  index: number
  current: boolean
  isCorrect: boolean | null
  flagged: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={`Question ${index + 1}`}
      className={cn(
        'relative h-9 w-9 rounded-lg text-sm font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        current && 'ring-2 ring-primary ring-offset-1 border-primary bg-primary text-primary-foreground',
        !current && isCorrect === true && 'border-green-400 bg-green-50 text-green-700 dark:bg-green-950/40 dark:border-green-700 dark:text-green-400',
        !current && isCorrect === false && 'border-red-400 bg-red-50 text-red-600 dark:bg-red-950/40 dark:border-red-700 dark:text-red-400',
        !current && isCorrect === null && 'border-border bg-background text-muted-foreground',
      )}
    >
      {index + 1}
      {flagged && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-400 border-2 border-background" />
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReviewPage({ params }: { params: Promise<{ testId: string }> }) {
  const { testId } = use(params)
  const { test, questions, isLoading } = useMockTestDetail(testId)

  const [currentIdx, setCurrentIdx] = useState(0)
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct' | 'flagged' | 'essay'>('all')

  // Build ordered rows with answers
  const rows = useMemo(() => {
    if (!test) return []
    return [...test.questions]
      .sort((a, b) => a.order - b.order)
      .map(eq => {
        const detail = questions.find(q => q._id === eq.questionId?.toString())
        return { ...eq, detail }
      })
  }, [test, questions])

  const filtered = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'wrong') return rows.filter(r => r.isCorrect === false)
    if (filter === 'correct') return rows.filter(r => r.isCorrect === true)
    if (filter === 'essay') return rows.filter(r => r.isCorrect === null)
    if (filter === 'flagged') return rows.filter(r => r.flagged)
    return rows
  }, [rows, filter])

  const current = filtered[currentIdx]

  const handleFilterChange = (f: typeof filter) => {
    setFilter(f)
    setCurrentIdx(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading review…</div>
      </div>
    )
  }

  if (!test || rows.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">No questions to review.</p>
        <Link href={`/mock-test/${testId}/results`} className="text-sm text-primary underline">Back to results</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 gap-4">
          <Link
            href={`/mock-test/${testId}/results`}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Results
          </Link>

          <span className="text-sm font-semibold text-foreground">
            Question Review
          </span>

          <span className="text-sm text-muted-foreground">
            {filtered.length > 0 ? `${currentIdx + 1} / ${filtered.length}` : '0 / 0'}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-4xl px-4 py-6 flex flex-col gap-6 flex-1">
        {/* ── Filter tabs ── */}
        <div className="flex flex-wrap gap-1.5">
          {((['all', 'wrong', 'correct', 'flagged', 'essay'] as const)).map(f => {
            const counts = {
              all: rows.length,
              wrong: rows.filter(r => r.isCorrect === false).length,
              correct: rows.filter(r => r.isCorrect === true).length,
              essay: rows.filter(r => r.isCorrect === null).length,
              flagged: rows.filter(r => r.flagged).length,
            }
            return (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize',
                  filter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                {f} <span className="opacity-70 ml-1">{counts[f]}</span>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
            <CheckCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No questions in this category.</p>
          </div>
        ) : (
          <>
            {/* ── Navigator dots ── */}
            <div className="flex flex-wrap gap-1.5">
              {filtered.map((row, i) => (
                <NavDot
                  key={row.questionId?.toString() ?? i}
                  index={i}
                  current={i === currentIdx}
                  isCorrect={row.isCorrect}
                  flagged={row.flagged ?? false}
                  onClick={() => setCurrentIdx(i)}
                />
              ))}
            </div>

            {/* ── Question card ── */}
            {current && (
              <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-muted-foreground">
                      Q{current.order}
                    </span>
                    {current.detail && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground capitalize">
                        {current.detail.questionType.replace(/_/g, ' ')}
                      </span>
                    )}
                    {current.detail?.section && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {current.detail.section}
                      </span>
                    )}
                    {current.flagged && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 px-2 py-0.5 text-xs text-orange-600 dark:text-orange-400">
                        <Flag className="h-3 w-3" /> Flagged
                      </span>
                    )}
                  </div>
                  <ResultBadge isCorrect={current.isCorrect} />
                </div>

                {/* Passage */}
                {current.detail?.passage && (
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Passage</p>
                    <p className="text-sm leading-relaxed line-clamp-6">{current.detail.passage}</p>
                  </div>
                )}

                {/* Question content */}
                {current.detail ? (
                  <ReviewRenderer
                    question={current.detail}
                    answer={current.userAnswer as string | string[] | null}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">Question details unavailable.</p>
                )}

                {/* Points */}
                <div className="text-xs text-muted-foreground text-right">
                  {current.pointsEarned} / {current.detail?.points ?? 1} pts
                </div>
              </div>
            )}

            {/* ── Prev / Next ── */}
            <div className="flex items-center justify-between">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-sm text-muted-foreground">
                {currentIdx + 1} of {filtered.length}
              </span>

              <button
                disabled={currentIdx === filtered.length - 1}
                onClick={() => setCurrentIdx(i => Math.min(filtered.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
