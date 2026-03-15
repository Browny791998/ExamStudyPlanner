'use client'

import { useState } from 'react'
import type { WeakAreaItem } from '@/types/progress'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  weakAreas: WeakAreaItem[]
  totalTests?: number
}

function FrequencyBadge({ freq }: { freq: number }) {
  const cls = freq >= 4
    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
    : freq >= 2
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
      : 'bg-muted text-muted-foreground'
  return <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cls)}>×{freq} tests</span>
}

export function WeakAreaAnalysis({ weakAreas, totalTests = 0 }: Props) {
  const [showAll, setShowAll] = useState(false)

  const sorted = [...weakAreas].sort((a, b) => b.frequency - a.frequency)
  const visible = showAll ? sorted : sorted.slice(0, 6)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-sm">Areas Needing Attention</h3>
        {totalTests > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5">Based on your last {totalTests} mock tests</p>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-border bg-green-50 dark:bg-green-950/30 p-4 text-sm text-center text-green-700 dark:text-green-400">
          No weak areas detected — great work! 🎉
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map(w => (
              <div key={w.area} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm">{w.area}</span>
                  <FrequencyBadge freq={w.frequency} />
                </div>

                <p className="text-xs text-muted-foreground">{w.recommendation}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Last flagged: {format(new Date(w.lastSeen), 'MMM d, yyyy')}</span>
                </div>

                {w.relatedSections.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {w.relatedSections.map(s => (
                      <Badge key={s} variant="secondary" className="text-xs px-2 py-0">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {sorted.length > 6 && (
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAll(v => !v)}>
              {showAll ? 'Show less' : `Show ${sorted.length - 6} more`}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
