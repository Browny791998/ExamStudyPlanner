"use client"

import { useState } from "react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setSelectedCalendarDate, setCalendarMonth } from "@/store/slices/uiSlice"
import { useCalendarData, useGCalSync } from "@/hooks/useDashboard"
import { useSelectedPlan } from "@/hooks/useStudyPlan"
import { DayDetailSheet } from "@/components/study-plan/DayDetailSheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Calendar, CheckCircle2, XCircle } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isPast,
  isSameDay,
  getDayOfYear,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { IDailyTask } from "@/types/studyPlan"

const SKILL_DOT: Record<string, string> = {
  Reading: "bg-blue-500",
  Writing: "bg-green-500",
  Listening: "bg-purple-500",
  Speaking: "bg-orange-500",
  Vocabulary: "bg-yellow-500",
  Grammar: "bg-pink-500",
  "Mock Test": "bg-red-500",
  Revision: "bg-gray-400",
  Math: "bg-indigo-500",
}

export default function CalendarPage() {
  const dispatch = useAppDispatch()
  const { calendarMonth, calendarYear, selectedCalendarDate } = useAppSelector(s => s.ui)
  const { selectedPlan: plan, plans, selectPlan } = useSelectedPlan()
  const { calendarData, isLoading } = useCalendarData(calendarMonth, calendarYear, plan?._id)
  const { syncToGCal, isSyncing } = useGCalSync()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle")

  const currentMonthDate = new Date(calendarYear, calendarMonth - 1, 1)

  const prevMonth = () => {
    const d = new Date(calendarYear, calendarMonth - 2, 1)
    dispatch(setCalendarMonth({ month: d.getMonth() + 1, year: d.getFullYear() }))
  }
  const nextMonth = () => {
    const d = new Date(calendarYear, calendarMonth, 1)
    dispatch(setCalendarMonth({ month: d.getMonth() + 1, year: d.getFullYear() }))
  }

  const monthStart = startOfMonth(currentMonthDate)
  const monthEnd = endOfMonth(currentMonthDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const allDays = eachDayOfInterval({ start: calStart, end: calEnd })

  const selectedDateObj = selectedCalendarDate ? new Date(selectedCalendarDate) : null
  const selectedDayKey = selectedDateObj ? format(selectedDateObj, "yyyy-MM-dd") : null
  const selectedDayData = selectedDayKey ? calendarData[selectedDayKey] : null
  const selectedTasks = (selectedDayData?.tasks ?? []) as IDailyTask[]

  const dayNumber =
    selectedDateObj && plan?.startDate
      ? getDayOfYear(selectedDateObj) - getDayOfYear(new Date(plan.startDate)) + 1
      : undefined

  const handleDayClick = (day: Date) => {
    dispatch(setSelectedCalendarDate(day.toISOString()))
    setSheetOpen(true)
  }

  const totalTasks = Object.values(calendarData).reduce((sum, d) => sum + d.totalCount, 0)

  return (
    <div className="space-y-4">
      {/* Plan selector — only shown when user has multiple plans */}
      {plans.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {plans.map(p => (
            <button
              key={p._id}
              onClick={() => selectPlan(p._id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-colors border",
                plan?._id === p._id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {p.examType}
            </button>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">{format(currentMonthDate, "MMMM yyyy")}</h1>
          <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* GCal sync */}
        {plan && (
          <div className="flex items-center gap-2">
            {syncStatus === "success" && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Synced!
              </span>
            )}
            {syncStatus === "error" && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <XCircle className="h-3 w-3" /> Sync failed
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              disabled={isSyncing}
              onClick={() => setConfirmOpen(true)}
            >
              {isSyncing ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Syncing…
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Sync to Google Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-1">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {allDays.map(day => {
            const key = format(day, "yyyy-MM-dd")
            const inMonth = isSameMonth(day, currentMonthDate)
            const dayData = calendarData[key]
            const isSelected = selectedDateObj ? isSameDay(day, selectedDateObj) : false
            const todayDay = isToday(day)
            const pastDay = isPast(day) && !todayDay
            const hasIncomplete = dayData && pastDay && dayData.completedCount < dayData.totalCount
            const allDone = dayData && dayData.completedCount === dayData.totalCount && dayData.totalCount > 0

            return (
              <button
                key={key}
                onClick={() => inMonth && handleDayClick(day)}
                disabled={!inMonth}
                className={cn(
                  "min-h-[80px] rounded-xl p-1.5 text-left transition-all relative flex flex-col",
                  inMonth ? "hover:bg-muted/70 cursor-pointer" : "opacity-30 cursor-default bg-muted/20",
                  todayDay && "ring-2 ring-primary",
                  isSelected && "bg-primary/10 ring-2 ring-primary",
                  hasIncomplete && "border border-destructive/40",
                  !inMonth && "bg-muted/10",
                )}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    todayDay && "bg-primary text-primary-foreground rounded-full h-5 w-5 flex items-center justify-center text-[10px]",
                    dayData?.hasTest && !todayDay && "font-bold",
                  )}>
                    {format(day, "d")}
                  </span>
                  {dayData?.hasTest && (
                    <span className="text-[9px] font-bold text-red-600 bg-red-100 rounded px-0.5">TEST</span>
                  )}
                </div>

                {/* Skill dots */}
                {dayData && dayData.tasks.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-auto">
                    {(dayData.tasks as IDailyTask[]).slice(0, 3).map((t, i) => (
                      <div key={i} className={cn("h-1.5 w-1.5 rounded-full", SKILL_DOT[t.skillFocus] ?? "bg-muted")} />
                    ))}
                    {dayData.totalCount > 3 && (
                      <span className="text-[9px] text-muted-foreground">+{dayData.totalCount - 3}</span>
                    )}
                  </div>
                )}

                {/* All done indicator */}
                {allDone && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Day detail sheet */}
      <DayDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={selectedDateObj}
        tasks={selectedTasks}
        dayNumber={dayNumber}
      />

      {/* GCal confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sync to Google Calendar</DialogTitle>
            <DialogDescription>
              This will create {totalTasks} calendar events in your Google Calendar.
              Existing synced events will be updated. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setConfirmOpen(false)
                if (plan) {
                  syncToGCal(plan._id, {
                    onSuccess: () => setSyncStatus("success"),
                    onError: () => setSyncStatus("error"),
                  })
                }
              }}
            >
              Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
