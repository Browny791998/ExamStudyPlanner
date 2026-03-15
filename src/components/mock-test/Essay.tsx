'use client'

import { cn } from '@/lib/utils'
import type { IQuestionFull } from '@/types/mockTest'

interface EssayProps {
  question: IQuestionFull
  answer: string
  onAnswer: (answer: string) => void
  isSubmitted: boolean
}

const MIN_WORDS = 150

export function Essay({ question, answer, onAnswer, isSubmitted }: EssayProps) {
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const meetsMinimum = wordCount >= MIN_WORDS

  return (
    <div className="space-y-4">
      {question.passage && (
        <div className="rounded-xl bg-muted/50 border border-border p-4 max-h-48 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Reading Passage</p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{question.passage}</p>
        </div>
      )}

      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      {!isSubmitted ? (
        <>
          <textarea
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full min-h-[200px] rounded-xl border border-border px-4 py-3 text-sm leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write your essay here…"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{wordCount} words</span>
            <span className={cn(meetsMinimum ? 'text-green-600' : 'text-red-500')}>
              {meetsMinimum ? '✓ Minimum met' : `Need ${MIN_WORDS - wordCount} more words`}
            </span>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground italic whitespace-pre-wrap">{answer || '(No essay submitted)'}</p>
          </div>
          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 p-4">
            <p className="text-sm font-semibold text-blue-700 mb-2">Essay submitted — not auto-graded</p>
            <p className="text-xs text-blue-600">Essays are reviewed manually. Tips for improvement:</p>
            <ul className="mt-2 space-y-1 text-xs text-blue-600 list-disc list-inside">
              <li>Ensure a clear introduction and conclusion</li>
              <li>Support arguments with specific examples</li>
              <li>Use varied vocabulary and sentence structures</li>
              <li>Check for grammar and spelling errors</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
