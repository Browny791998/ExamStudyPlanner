"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStudyPlans, useDeletePlan, useDailyTasks } from "@/hooks/useStudyPlan"
import type { IStudyPlan } from "@/types/studyPlan"
import { TaskItem } from "@/components/dashboard/TaskItem"
import { useCompleteTask } from "@/hooks/useDashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import { BookOpen, Trash2, ChevronDown, ChevronUp, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeekGoal {
  week: number
  focus: string
  targetTasksCount: number
}

const EXAM_COLORS: Record<string, string> = {
  IELTS: "card-gradient-violet",
  TOEFL: "card-gradient-blue",
  JLPT: "card-gradient-rose",
  SAT: "card-gradient-green",
}

function WeekAccordion({ week, planId }: { week: WeekGoal; planId: string }) {
  const [open, setOpen] = useState(false)
  const { tasks, isLoading } = useDailyTasks(undefined, week.week, planId)
  const { completeTask, isCompleting } = useCompleteTask()

  const completed = tasks.filter(t => t.completed).length
  const total = tasks.length || week.targetTasksCount
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-semibold text-muted-foreground w-14 shrink-0">Week {week.week}</span>
          <span className="text-sm font-medium truncate">{week.focus}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-xs text-muted-foreground">{completed}/{total}</span>
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-2 py-2 bg-muted/20 space-y-0.5">
          {isLoading ? (
            <div className="space-y-1 p-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground px-4 py-3">No tasks loaded.</p>
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
      )}
    </div>
  )
}

function PlanPanel({ plan }: { plan: IStudyPlan }) {
  const { mutate: deletePlan, isPending: isDeleting } = useDeletePlan()
  const router = useRouter()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const gradientClass = EXAM_COLORS[plan.examType] ?? "card-gradient-violet"

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className={cn(gradientClass, "p-5 text-white")}>
          <h2 className="text-lg font-bold">{plan.title}</h2>
          <p className="text-white/70 text-sm mt-0.5">Active Study Plan</p>
        </div>
        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Exam</p>
            <p className="font-semibold text-sm">{plan.examType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-semibold text-sm">{plan.targetScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Exam Date</p>
            <p className="font-semibold text-sm">{format(new Date(plan.examDate), "MMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="font-semibold text-sm">{format(new Date(plan.startDate), "MMM d, yyyy")}</p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Overall Progress</span>
              <span>{plan.overallProgress}%</span>
            </div>
            <Progress value={plan.overallProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-base font-semibold mb-3">Weekly Breakdown</h3>
        <div className="space-y-2">
          {(plan.weeklyGoals ?? []).map(week => (
            <WeekAccordion key={week.week} week={week} planId={plan._id} />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="destructive" size="sm" className="gap-2" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> Delete Plan
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {plan.examType} Plan?</DialogTitle>
            <DialogDescription>
              This will permanently delete your {plan.examType} study plan and all 90 daily tasks. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                deletePlan(plan._id, {
                  onSuccess: () => { setConfirmDelete(false); router.refresh() },
                })
              }}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function StudyPlanPage() {
  const router = useRouter()
  const { plans, isLoading } = useStudyPlans()
  const [activeTab, setActiveTab] = useState(0)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-10 rounded-2xl" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <BookOpen className="h-10 w-10 opacity-30" />
        <p className="text-sm">No active study plans.</p>
        <Button size="sm" onClick={() => router.push("/onboarding")}>Create a Plan</Button>
      </div>
    )
  }

  const safeTab = Math.min(activeTab, plans.length - 1)
  const currentPlan = plans[safeTab]

  return (
    <div className="space-y-6">
      {/* Exam type tabs + Add Plan button */}
      <div className="flex items-center gap-2 flex-wrap">
        {plans.map((plan, i) => (
          <button
            key={plan._id}
            onClick={() => setActiveTab(i)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition-colors border",
              safeTab === i
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted",
            )}
          >
            {plan.examType}
          </button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 ml-auto"
          onClick={() => router.push("/onboarding")}
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Active plan detail */}
      <PlanPanel key={currentPlan._id} plan={currentPlan} />
    </div>
  )
}
