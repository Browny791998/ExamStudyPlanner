'use client'

import { cn } from '@/lib/utils'
import { CheckCircle, XCircle } from 'lucide-react'
import type { IQuestionFull } from '@/types/mockTest'

interface MultipleChoiceProps {
  question: IQuestionFull
  selectedAnswer: string | null
  onAnswer: (answer: string) => void
  isSubmitted: boolean
  showExplanation: boolean
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export function MultipleChoice({ question, selectedAnswer, onAnswer, isSubmitted, showExplanation }: MultipleChoiceProps) {
  const options = question.options ?? []
  const correct = question.correctAnswer

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      <div className="space-y-2">
        {options.map((option, i) => {
          const letter = LETTERS[i]
          const isSelected = selectedAnswer === letter
          const isCorrect = correct === letter
          const isWrong = isSubmitted && isSelected && !isCorrect

          return (
            <button
              key={letter}
              type="button"
              disabled={isSubmitted}
              onClick={() => onAnswer(letter)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                !isSubmitted && !isSelected && 'border-border hover:border-primary/40 hover:bg-muted/50',
                !isSubmitted && isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
                isSubmitted && isCorrect && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                isSubmitted && isWrong && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                isSubmitted && !isSelected && !isCorrect && 'border-border opacity-60',
              )}
            >
              <span className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                !isSubmitted && isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                isSubmitted && isCorrect && 'bg-green-500 text-white',
                isSubmitted && isWrong && 'bg-red-500 text-white',
              )}>
                {letter}
              </span>
              <span className="flex-1 text-sm">{option}</span>
              {isSubmitted && isCorrect && <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />}
              {isSubmitted && isWrong && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
            </button>
          )
        })}
      </div>

      {showExplanation && question.explanation && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 mt-4">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Explanation</p>
          <p className="text-sm text-amber-800 dark:text-amber-300">{question.explanation}</p>
        </div>
      )}
    </div>
  )
}
