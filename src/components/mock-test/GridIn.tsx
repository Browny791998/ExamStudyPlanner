'use client'

import { cn } from '@/lib/utils'
import type { IQuestionFull } from '@/types/mockTest'

interface GridInProps {
  question: IQuestionFull
  answer: string
  onAnswer: (answer: string) => void
  isSubmitted: boolean
  showExplanation: boolean
}

export function GridIn({ question, answer, onAnswer, isSubmitted, showExplanation }: GridInProps) {
  const correct = question.correctAnswer ?? ''
  const isCorrect = isSubmitted
    ? Math.abs(parseFloat(answer) - parseFloat(correct)) < 0.001
    : null

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      <div className="flex flex-col items-center gap-3">
        <div className={cn(
          'w-40 rounded-xl border-2 overflow-hidden',
          !isSubmitted && 'border-border',
          isCorrect === true && 'border-green-500',
          isCorrect === false && 'border-red-500',
        )}>
          <div className="grid grid-cols-4 border-b border-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-r last:border-r-0 border-border h-8 bg-muted/30" />
            ))}
          </div>
          <input
            type="text"
            value={answer}
            disabled={isSubmitted}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full px-3 py-3 text-center text-lg font-bold focus:outline-none bg-background"
            placeholder="0"
            inputMode="decimal"
          />
        </div>
        <p className="text-xs text-muted-foreground">Enter an integer, decimal, or fraction (e.g. 3/4)</p>

        {isSubmitted && isCorrect === false && (
          <p className="text-sm text-green-600 font-medium">Correct answer: {correct}</p>
        )}
        {isSubmitted && isCorrect === true && (
          <p className="text-sm text-green-600 font-medium">✓ Correct!</p>
        )}
      </div>

      {showExplanation && question.explanation && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Explanation</p>
          <p className="text-sm text-amber-800">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
