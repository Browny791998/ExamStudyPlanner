'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
import type { IQuestionFull } from '@/types/mockTest'

interface TrueFalseProps {
  question: IQuestionFull
  selectedAnswer: string | null
  onAnswer: (answer: string) => void
  isSubmitted: boolean
  showExplanation: boolean
}

const OPTIONS = ['TRUE', 'FALSE', 'NOT GIVEN']

export function TrueFalse({ question, selectedAnswer, onAnswer, isSubmitted, showExplanation }: TrueFalseProps) {
  const correct = (question.correctAnswer ?? '').toUpperCase()

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      <div className="space-y-3">
        {OPTIONS.map((option) => {
          const isSelected = selectedAnswer?.toUpperCase() === option
          const isCorrect = correct === option
          const isWrong = isSubmitted && isSelected && !isCorrect

          return (
            <button
              key={option}
              type="button"
              disabled={isSubmitted}
              onClick={() => onAnswer(option)}
              className={cn(
                'w-full flex items-center justify-between rounded-xl border-2 px-6 py-4 font-semibold text-sm transition-all',
                !isSubmitted && !isSelected && 'border-border hover:border-primary/40 hover:bg-muted/50',
                !isSubmitted && isSelected && 'border-primary bg-primary/5',
                isSubmitted && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-700',
                isSubmitted && isWrong && 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700',
                isSubmitted && !isSelected && !isCorrect && 'border-border opacity-50',
              )}
            >
              {option}
              {isSubmitted && isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
              {isSubmitted && isWrong && <XCircle className="h-5 w-5 text-red-500" />}
            </button>
          )
        })}
      </div>

      {showExplanation && question.explanation && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-4">
          <p className="text-xs font-semibold text-amber-700 mb-1">Explanation</p>
          <p className="text-sm text-amber-800 dark:text-amber-300">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
