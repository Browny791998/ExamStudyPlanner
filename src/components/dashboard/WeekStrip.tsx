"use client"

import { startOfWeek, addDays, isSameDay, isToday, isPast, format } from "date-fns"
import { cn } from "@/lib/utils"
import type { IDailyTask } from "@/types/studyPlan"

interface WeekStripProps {
  tasks: IDailyTask[]
  currentDate: Date
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"]

export function WeekStrip({ tasks, currentDate }: WeekStripProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex gap-1">
      {days.map((day, i) => {
        const dayTasks = tasks.filter(t => isSameDay(new Date(t.scheduledDate), day))
        const total = dayTasks.length
        const completed = dayTasks.filter(t => t.completed).length
        const today = isToday(day)
        const past = isPast(day) && !today

        let dotColor = "bg-muted-foreground/20"
        if (total > 0) {
          if (completed === total) dotColor = "bg-green-500"
          else if (completed > 0) dotColor = "bg-yellow-400"
          else if (past) dotColor = "bg-red-400"
          else dotColor = "bg-muted-foreground/30"
        }

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">{DAY_LETTERS[i]}</span>
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
              today ? "bg-primary text-primary-foreground ring-2 ring-primary/30" : "text-foreground"
            )}>
              {format(day, "d")}
            </div>
            {total > 0 && (
              <div className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
            )}
          </div>
        )
      })}
    </div>
  )
}
