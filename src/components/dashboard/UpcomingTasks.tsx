"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isToday, isTomorrow, format } from "date-fns"
import { cn } from "@/lib/utils"
import type { IDailyTask } from "@/types/studyPlan"
import { BookOpen } from "lucide-react"

interface UpcomingTasksProps {
  tasks: IDailyTask[]
}

const SKILL_DOT: Record<string, string> = {
  Reading: "bg-blue-500", Writing: "bg-green-500", Listening: "bg-purple-500",
  Speaking: "bg-orange-500", Vocabulary: "bg-yellow-500", Grammar: "bg-pink-500",
  "Mock Test": "bg-red-500", Revision: "bg-gray-400", Math: "bg-indigo-500",
}

function formatTaskDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return "Today"
  if (isTomorrow(d)) return "Tomorrow"
  return format(d, "EEE, MMM d")
}

export function UpcomingTasks({ tasks }: UpcomingTasksProps) {
  const shown = tasks.slice(0, 5)
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Upcoming Tasks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <BookOpen className="h-8 w-8 opacity-30" />
            <p className="text-sm">You&apos;re all caught up!</p>
          </div>
        ) : (
          shown.map(task => (
            <div key={task._id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/50 transition-colors">
              <div className={cn("h-2 w-2 rounded-full shrink-0", SKILL_DOT[task.skillFocus] ?? "bg-muted")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{formatTaskDate(task.scheduledDate)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
