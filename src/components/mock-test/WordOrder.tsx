'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { IQuestionFull } from '@/types/mockTest'

interface WordOrderProps {
  question: IQuestionFull
  currentOrder: string[]
  onAnswer: (order: string[]) => void
  isSubmitted: boolean
  showExplanation: boolean
}

export function WordOrder({ question, currentOrder, onAnswer, isSubmitted, showExplanation }: WordOrderProps) {
  const allWords = question.words ?? []
  const correctOrder = question.correctOrder ?? []

  // Words not yet placed in answer zone
  const bankWords = allWords.filter(w => !currentOrder.includes(w))
    .concat(allWords.filter(w => currentOrder.filter(c => c === w).length < allWords.filter(a => a === w).length))

  const [dragSource, setDragSource] = useState<{ zone: 'bank' | 'answer'; index: number } | null>(null)

  const addWord = (word: string) => {
    if (!isSubmitted) onAnswer([...currentOrder, word])
  }

  const removeWord = (index: number) => {
    if (!isSubmitted) onAnswer(currentOrder.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    if (!isSubmitted) onAnswer([])
  }

  const handleDragStart = (zone: 'bank' | 'answer', index: number) => {
    setDragSource({ zone, index })
  }

  const handleDropOnAnswer = (targetIndex: number) => {
    if (!dragSource || isSubmitted) return
    const newOrder = [...currentOrder]

    if (dragSource.zone === 'answer') {
      // Swap within answer
      const moved = newOrder.splice(dragSource.index, 1)[0]
      newOrder.splice(targetIndex, 0, moved)
      onAnswer(newOrder)
    } else {
      // From bank: get all remaining bank words
      const remaining = allWords.filter(w => {
        const inAnswer = currentOrder.filter(c => c === w).length
        const total = allWords.filter(a => a === w).length
        return inAnswer < total
      })
      const word = remaining[dragSource.index]
      if (word) {
        newOrder.splice(targetIndex, 0, word)
        onAnswer(newOrder)
      }
    }
    setDragSource(null)
  }

  const isOrderCorrect = isSubmitted && JSON.stringify(currentOrder) === JSON.stringify(correctOrder)

  // Determine bank words (deduplicated by usage)
  const usageCounts = new Map<string, number>()
  for (const w of currentOrder) {
    usageCounts.set(w, (usageCounts.get(w) ?? 0) + 1)
  }
  const availableBank = allWords.filter(w => {
    const used = usageCounts.get(w) ?? 0
    const total = allWords.filter(a => a === w).length
    return used < total
  })

  return (
    <div className="space-y-4">
      <p className="text-base font-medium leading-relaxed">{question.question}</p>

      {/* Word Bank */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 font-medium">Word Bank — click to add</p>
        <div className="min-h-12 flex flex-wrap gap-2 rounded-xl border-2 border-dashed border-border p-3 bg-muted/20">
          {availableBank.map((word, i) => (
            <button
              key={`bank-${word}-${i}`}
              type="button"
              disabled={isSubmitted}
              draggable
              onDragStart={() => handleDragStart('bank', i)}
              onClick={() => addWord(word)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
            >
              {word}
            </button>
          ))}
          {availableBank.length === 0 && !isSubmitted && (
            <span className="text-xs text-muted-foreground">All words placed</span>
          )}
        </div>
      </div>

      {/* Answer Zone */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium">Your Answer</p>
          {!isSubmitted && currentOrder.length > 0 && (
            <button type="button" onClick={clearAll} className="text-xs text-destructive hover:underline">
              Clear all
            </button>
          )}
        </div>
        <div
          className="min-h-12 flex flex-wrap gap-2 rounded-xl border-2 border-primary/30 p-3 bg-primary/5"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDropOnAnswer(currentOrder.length)}
        >
          {currentOrder.map((word, i) => (
            <button
              key={`answer-${word}-${i}`}
              type="button"
              disabled={isSubmitted}
              draggable
              onDragStart={() => handleDragStart('answer', i)}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
              onDrop={(e) => { e.stopPropagation(); handleDropOnAnswer(i) }}
              onClick={() => removeWord(i)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                !isSubmitted && 'border-primary/50 bg-primary/10 hover:bg-destructive/10 hover:border-destructive/50',
                isSubmitted && isOrderCorrect && 'border-green-500 bg-green-50 text-green-700',
                isSubmitted && !isOrderCorrect && 'border-red-400 bg-red-50 text-red-700',
              )}
            >
              {word}
            </button>
          ))}
          {currentOrder.length === 0 && (
            <span className="text-xs text-muted-foreground">Click words to build your answer</span>
          )}
        </div>
      </div>

      {isSubmitted && !isOrderCorrect && correctOrder.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="text-xs font-semibold text-green-700 mb-1">Correct Order</p>
          <div className="flex flex-wrap gap-2">
            {correctOrder.map((word, i) => (
              <span key={i} className="rounded-lg border border-green-400 bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {word}
              </span>
            ))}
          </div>
        </div>
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
