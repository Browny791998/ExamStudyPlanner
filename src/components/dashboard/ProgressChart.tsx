"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format, subDays, isSameDay, startOfDay } from "date-fns"
import type { IDailyTask } from "@/types/studyPlan"

interface ProgressChartProps {
  tasks: IDailyTask[]
}

export function ProgressChart({ tasks }: ProgressChartProps) {
  const today = startOfDay(new Date())
  const days = Array.from({ length: 7 }, (_, i) => subDays(today, 6 - i))

  const data = days.map(day => {
    const dayTasks = tasks.filter(t => t.completed && isSameDay(new Date(t.scheduledDate), day))
    const mins = dayTasks.reduce((sum, t) => sum + t.durationMins, 0)
    return { day, mins, label: format(day, "EEE")[0] }
  })

  const maxMins = Math.max(...data.map(d => d.mins), 1)

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Study Activity (7 days)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every(d => d.mins === 0) ? (
          <p className="text-sm text-muted-foreground">No study sessions recorded yet.</p>
        ) : (
          <div className="flex items-end gap-2 h-24">
            {data.map(({ day, mins, label }, i) => {
              const isToday = isSameDay(day, today)
              const height = mins > 0 ? Math.max(8, Math.round((mins / maxMins) * 100)) : 4
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end" style={{ height: "80px" }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${isToday ? "bg-primary" : "bg-primary/40"}`}
                      style={{ height: `${height}%` }}
                      title={`${mins} min`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
