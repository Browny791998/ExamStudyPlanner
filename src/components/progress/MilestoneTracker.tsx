'use client'

import type { MilestoneItem } from '@/types/progress'
import { format, differenceInDays, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

interface Props {
  milestones: MilestoneItem[]
}

function MilestoneStatus({ m, isNext }: { m: MilestoneItem; isNext: boolean }) {
  if (m.achieved) return <span className="text-xl">✅</span>
  const overdue = isPast(new Date(m.targetDate)) && !m.achieved
  if (overdue) return <span className="text-xl">⚠️</span>
  if (isNext) return (
    <span className="text-xl relative">
      🎯
      <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />
    </span>
  )
  return <span className="text-xl opacity-40">⭕</span>
}

export function MilestoneTracker({ milestones }: Props) {
  if (milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones set.</p>
  }

  const sorted = [...milestones].sort((a, b) => a.weekNumber - b.weekNumber)
  const nextIdx = sorted.findIndex(m => !m.achieved)

  return (
    <div className="space-y-0">
      {sorted.map((m, idx) => {
        const isNext = idx === nextIdx
        const overdue = isPast(new Date(m.targetDate)) && !m.achieved
        const targetDate = new Date(m.targetDate)
        const daysRemaining = differenceInDays(targetDate, new Date())

        return (
          <div key={m._id} className="flex gap-4">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm',
                m.achieved ? 'bg-green-100 dark:bg-green-950' :
                overdue ? 'bg-amber-100 dark:bg-amber-950' :
                isNext ? 'bg-primary/10 ring-2 ring-primary' : 'bg-muted'
              )}>
                <MilestoneStatus m={m} isNext={isNext} />
              </div>
              {idx < sorted.length - 1 && (
                <div className={cn(
                  'w-0.5 flex-1 my-1',
                  m.achieved ? 'bg-green-300 dark:bg-green-700' : 'border-l-2 border-dashed border-border'
                )} style={{ minHeight: '24px' }} />
              )}
            </div>

            {/* Content */}
            <div className={cn(
              'flex-1 rounded-xl border p-4 mb-3',
              isNext ? 'border-primary/40 bg-primary/5' :
              m.achieved ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' :
              overdue ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20' :
              'border-border bg-card'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {isNext && (
                    <span className="text-xs font-medium text-primary block mb-1">Next milestone</span>
                  )}
                  <p className={cn('text-sm', m.achieved ? 'font-semibold' : 'font-medium')}>{m.title}</p>
                  {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">Wk {m.weekNumber}</span>
              </div>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                {m.achieved && m.achievedAt ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Achieved {format(new Date(m.achievedAt), 'MMM d')}
                    </span>
                    {m.daysEarly && m.daysEarly > 0 && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {m.daysEarly} day{m.daysEarly > 1 ? 's' : ''} early 🎉
                      </span>
                    )}
                    {m.daysLate && m.daysLate > 0 && (
                      <span className="text-xs font-medium text-amber-600">
                        {m.daysLate} day{m.daysLate > 1 ? 's' : ''} late
                      </span>
                    )}
                  </>
                ) : overdue ? (
                  <span className="text-xs text-amber-600">
                    Overdue · was due {format(targetDate, 'MMM d')}
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Target: Week {m.weekNumber} · {format(targetDate, 'MMM d')}
                    </span>
                    {daysRemaining >= 0 && (
                      <span className="text-xs text-muted-foreground">
                        in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
