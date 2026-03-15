'use client'

import { cn } from '@/lib/utils'
import type { IQuestionFull } from '@/types/mockTest'

interface FillBlankProps {
  question: IQuestionFull
  answers: string[]
  onAnswer: (answers: string[]) => void
  isSubmitted: boolean
  showExplanation: boolean
}

export function FillBlank({ question, answers, onAnswer, isSubmitted, showExplanation }: FillBlankProps) {
  const blanks = question.blanks ?? []

  const handleChange = (index: number, value: string) => {
    const updated = [...answers]
    updated[index] = value
    onAnswer(updated)
  }

  // Parse question text to split by [blank] markers
  // Use blank index as placeholder
  const parts = question.question.split(/(\[_+\]|\[blank\d*\])/gi)

  let blankIdx = 0
  const rendered: React.ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (/\[_+\]|\[blank\d*\]/i.test(part)) {
      const idx = blankIdx++
      const blank = blanks[idx]
      const userVal = answers[idx] ?? ''
      const isCorrect = isSubmitted && blank
        ? userVal.trim().toLowerCase() === blank.answer.trim().toLowerCase()
        : null

      rendered.push(
        <span key={`blank-${idx}`} className="inline-flex flex-col items-center mx-1">
          <input
            type="text"
            value={userVal}
            disabled={isSubmitted}
            onChange={(e) => handleChange(idx, e.target.value)}
            style={{ width: '120px' }}
            className={cn(
              'inline-block rounded-md border px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary',
              !isSubmitted && 'border-border',
              isCorrect === true && 'border-green-500 bg-green-50 dark:bg-green-950/30',
              isCorrect === false && 'border-red-500 bg-red-50 dark:bg-red-950/30',
            )}
            placeholder={`Blank ${idx + 1}`}
          />
          {isSubmitted && isCorrect === false && blank && (
            <span className="text-xs text-green-600 mt-0.5">✓ {blank.answer}</span>
          )}
        </span>
      )
    } else {
      rendered.push(<span key={`text-${i}`}>{part}</span>)
    }
  }

  // If no blanks markers found in text, render inputs below
  const hasInlineMarkers = /\[_+\]|\[blank\d*\]/i.test(question.question)

  return (
    <div className="space-y-4">
      {hasInlineMarkers ? (
        <div className="text-base leading-relaxed">{rendered}</div>
      ) : (
        <>
          <p className="text-base font-medium leading-relaxed">{question.question}</p>
          <div className="space-y-3">
            {blanks.map((blank, idx) => {
              const userVal = answers[idx] ?? ''
              const isCorrect = isSubmitted
                ? userVal.trim().toLowerCase() === blank.answer.trim().toLowerCase()
                : null
              return (
                <div key={idx} className="space-y-1">
                  <label className="text-xs text-muted-foreground">Blank {idx + 1}{blank.hint ? ` (${blank.hint})` : ''}</label>
                  <input
                    type="text"
                    value={userVal}
                    disabled={isSubmitted}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary',
                      !isSubmitted && 'border-border',
                      isCorrect === true && 'border-green-500 bg-green-50',
                      isCorrect === false && 'border-red-500 bg-red-50',
                    )}
                    placeholder="Your answer"
                  />
                  {isSubmitted && isCorrect === false && (
                    <p className="text-xs text-green-600">Correct: {blank.answer}</p>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {showExplanation && question.explanation && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Explanation</p>
          <p className="text-sm text-amber-800">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
