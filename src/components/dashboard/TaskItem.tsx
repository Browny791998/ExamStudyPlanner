"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { IDailyTask } from "@/types/studyPlan"
import { Check, Clock, Pencil } from "lucide-react"
import { EditTaskSheet } from "@/components/study-plan/EditTaskSheet"

interface TaskItemProps {
  task: IDailyTask
  onComplete?: (id: string) => void
  isCompleting?: boolean
}

const SKILL_BADGE: Record<string, string> = {
  Reading:    "bg-blue-100 text-blue-700",
  Writing:    "bg-green-100 text-green-700",
  Listening:  "bg-purple-100 text-purple-700",
  Speaking:   "bg-orange-100 text-orange-700",
  Vocabulary: "bg-yellow-100 text-yellow-700",
  Grammar:    "bg-pink-100 text-pink-700",
  "Mock Test":"bg-red-100 text-red-700",
  Revision:   "bg-gray-100 text-gray-600",
  Math:       "bg-indigo-100 text-indigo-700",
}

export function TaskItem({ task, onComplete, isCompleting }: TaskItemProps) {
  const badgeClass = SKILL_BADGE[task.skillFocus] ?? "bg-muted text-muted-foreground"
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <div className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        task.completed ? "opacity-60" : "hover:bg-muted/50"
      )}>
        {/* Checkbox */}
        {onComplete && (
          <button
            type="button"
            disabled={isCompleting}
            onClick={() => onComplete(task._id)}
            className={cn(
              "h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors",
              task.completed
                ? "bg-green-500 border-green-500 text-white"
                : "border-muted-foreground/40 hover:border-primary"
            )}
          >
            {task.completed && <Check className="h-3 w-3" />}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", task.completed && "line-through text-muted-foreground")}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeClass)}>
              {task.skillFocus}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.durationMins} min
            </span>
            {(task as IDailyTask & { isCustom?: boolean }).isCustom && (
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700">
                custom
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {task.completed && (
          <Check className="h-4 w-4 text-green-500 shrink-0" />
        )}
      </div>

      <EditTaskSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        task={task}
      />
    </>
  )
}
