'use client'

import type { SectionBreakdownItem } from '@/types/progress'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props {
  sections: SectionBreakdownItem[]
}

function TrendBadge({ trend }: { trend: SectionBreakdownItem['trend'] }) {
  if (trend === 'improving') return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
      <TrendingUp className="h-3.5 w-3.5" /> Improving
    </span>
  )
  if (trend === 'declining') return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-500">
      <TrendingDown className="h-3.5 w-3.5" /> Declining
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> Stable
    </span>
  )
}

function scoreBarColor(avg: number) {
  if (avg >= 80) return 'bg-green-500'
  if (avg >= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

export function SectionBreakdown({ sections }: Props) {
  if (sections.length === 0) {
    return <p className="text-sm text-muted-foreground">No section data yet.</p>
  }

  return (
    <div className="space-y-3">
      {sections.map(s => (
        <div key={s.section} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{s.section}</span>
            <TrendBadge trend={s.trend} />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Average</span>
              <span className="font-medium">{s.averageScore}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', scoreBarColor(s.averageScore))}
                style={{ width: `${s.averageScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Best: <span className="font-medium text-foreground">{s.bestScore}%</span></span>
            <span>·</span>
            <span>Worst: <span className="font-medium text-foreground">{s.worstScore}%</span></span>
            <span>·</span>
            <span>Tests: <span className="font-medium text-foreground">{s.totalAttempts}</span></span>
          </div>
        </div>
      ))}
    </div>
  )
}
