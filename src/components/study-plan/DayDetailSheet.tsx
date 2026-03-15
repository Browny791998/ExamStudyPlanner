"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TaskItem } from "@/components/dashboard/TaskItem"
import { useCompleteTask } from "@/hooks/useDashboard"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import type { IDailyTask } from "@/types/studyPlan"
import { Clock } from "lucide-react"

interface DayDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date | null
  tasks: IDailyTask[]
  dayNumber?: number
}

export function DayDetailSheet({ open, onOpenChange, date, tasks, dayNumber }: DayDetailSheetProps) {
  const router = useRouter()
  const { completeTask, isCompleting } = useCompleteTask()
  const [notes, setNotes] = useState("")

  const totalMins = tasks.reduce((sum, t) => sum + t.durationMins, 0)
  const hasMockTest = tasks.some(t => t.taskType === "mock_test")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>
            {date ? format(date, "EEEE, MMMM d") : ""}
          </SheetTitle>
          {dayNumber && (
            <p className="text-sm text-muted-foreground">Day {dayNumber} of 90</p>
          )}
        </SheetHeader>

        {/* Total time */}
        {tasks.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 px-4">
            <Clock className="h-4 w-4" />
            <span>Total: {totalMins} min ({(totalMins / 60).toFixed(1)}h)</span>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-1 mb-4 px-2">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No tasks for this day.</p>
          ) : (
            tasks.map(task => (
              <TaskItem
                key={task._id}
                task={task}
                onComplete={(id) => completeTask({ taskId: id, completed: !task.completed })}
                isCompleting={isCompleting}
              />
            ))
          )}
        </div>

        {/* Notes */}
        <div className="space-y-1.5 mb-4 px-4">
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes for this day..."
            className="resize-none h-24"
          />
        </div>

        {/* Mock test CTA */}
        {hasMockTest && (
          <div className="px-4">
            <Button
              className="w-full card-gradient-violet border-0 text-white"
              onClick={() => { onOpenChange(false); router.push("/mock-test") }}
            >
              Start Mock Test
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
