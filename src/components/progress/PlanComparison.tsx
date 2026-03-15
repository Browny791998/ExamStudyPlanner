'use client'

import type { PlanComparisonItem } from '@/types/progress'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Props {
  plans: PlanComparisonItem[]
  currentPlanId?: string
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  paused: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

export function PlanComparison({ plans, currentPlanId }: Props) {
  if (plans.length <= 1) return null

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Your Exam Plans</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Comparison across all your study plans</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Tests</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Best</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Latest</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => {
                const isCurrent = p.planId === currentPlanId
                return (
                  <tr key={p.planId} className={cn('border-t border-border', isCurrent && 'bg-primary/5')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.examType}</span>
                        {isCurrent && <Badge variant="default" className="text-xs h-5">Current</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.targetScore}</td>
                    <td className="px-4 py-3 font-medium">{p.testsCount}</td>
                    <td className="px-4 py-3 font-semibold">{p.bestScore}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.latestScore}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_COLORS[p.status] ?? 'bg-muted text-muted-foreground')}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
