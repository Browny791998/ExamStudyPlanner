'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TimerProps {
  timeRemainingSeconds: number
  totalMins: number
  onExpire: () => void
}

export function Timer({ timeRemainingSeconds, totalMins, onExpire }: TimerProps) {
  const totalSeconds = totalMins * 60
  const progress = totalSeconds > 0 ? timeRemainingSeconds / totalSeconds : 0

  useEffect(() => {
    if (timeRemainingSeconds === 0) {
      onExpire()
    }
  }, [timeRemainingSeconds, onExpire])

  const totalMinsRemaining = Math.floor(timeRemainingSeconds / 60)
  const hours = Math.floor(totalMinsRemaining / 60)
  const mins = totalMinsRemaining % 60
  const secs = timeRemainingSeconds % 60
  const display = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  const isAmber = timeRemainingSeconds < 10 * 60 && timeRemainingSeconds >= 5 * 60
  const isRed = timeRemainingSeconds < 5 * 60

  // SVG circle
  const r = 20
  const circumference = 2 * Math.PI * r
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-10 w-10">
        <svg className="h-10 w-10 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
          <circle
            cx="24" cy="24" r={r} fill="none"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              'transition-all duration-1000',
              isRed ? 'text-red-500' : isAmber ? 'text-amber-500' : 'text-primary',
            )}
            stroke="currentColor"
          />
        </svg>
      </div>
      <span className={cn(
        'text-lg font-bold font-mono tabular-nums',
        isRed && 'text-red-500 animate-pulse',
        isAmber && 'text-amber-500',
        !isRed && !isAmber && 'text-foreground',
      )}>
        {display}
      </span>
    </div>
  )
}
