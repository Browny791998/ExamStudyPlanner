"use client"

import { useDashboardData, useCompleteTask } from "@/hooks/useDashboard"
import { useSelectedPlan } from "@/hooks/useStudyPlan"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { TaskItem } from "@/components/dashboard/TaskItem"
import { WeekStrip } from "@/components/dashboard/WeekStrip"
import { ProgressChart } from "@/components/dashboard/ProgressChart"
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Flame, Target, TrendingUp, Zap, Trophy } from "lucide-react"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/authSlice"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { selectedPlan, plans, selectPlan } = useSelectedPlan()
  const { data, isLoading } = useDashboardData(selectedPlan?._id)
  const { completeTask, isCompleting } = useCompleteTask()
  const user = useAppSelector(selectUser)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 18) return "Good afternoon"
    return "Good evening"
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Zap className="h-10 w-10 opacity-30" />
        <p className="text-sm">No active study plan. Start by completing onboarding.</p>
      </div>
    )
  }

  const { stats, todayTasks, upcomingTasks, currentWeekTasks, milestones, recentMockScores } = data

  return (
    <div className="space-y-6">
      {/* Plan selector — only shown when user has multiple plans */}
      {plans.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {plans.map(plan => (
            <button
              key={plan._id}
              onClick={() => selectPlan(plan._id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-colors border",
                selectedPlan?._id === plan._id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
              )}
            >
              {plan.examType}
            </button>
          ))}
        </div>
      )}

      {/* Greeting banner */}
      <div className="rounded-2xl bg-linear-to-r from-violet-600 via-purple-600 to-indigo-600 p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">{greeting()}, {user?.name?.split(" ")[0] ?? "there"}</p>
            <h1 className="text-xl font-bold mt-0.5">
              {stats.currentStreak > 0
                ? `🔥 ${stats.currentStreak}-day streak! Keep it up!`
                : "Ready to study today? 🎯"}
            </h1>
            <p className="text-white/70 text-xs mt-1">
              {stats.daysUntilExam > 0
                ? `${stats.daysUntilExam} days until your exam`
                : "Exam day is here — you got this!"}
            </p>
          </div>
          <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Zap className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overall Progress"
          value={`${stats.overallProgress}%`}
          subtitle={`${stats.completedTasks}/${stats.totalTasks} tasks`}
          icon={Target}
          gradient="violet"
          variant="progress"
          progressValue={stats.overallProgress}
        />
        <StatsCard
          title="Study Streak"
          value={`${stats.currentStreak}d`}
          subtitle={`Best: ${stats.longestStreak} days`}
          icon={Flame}
          gradient="orange"
        />
        <StatsCard
          title="Days Until Exam"
          value={stats.daysUntilExam}
          subtitle="Stay consistent!"
          icon={TrendingUp}
          gradient="blue"
        />
        <StatsCard
          title="Study Hours"
          value={`${(stats.totalStudyMins / 60).toFixed(1)}h`}
          subtitle="Total completed"
          icon={Clock}
          gradient="teal"
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Today's tasks + week strip */}
        <div className="lg:col-span-7 space-y-4">
          {/* Today's tasks */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Today&apos;s Tasks
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(), "EEEE, MMM d")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No tasks scheduled for today. 🎉
                </p>
              ) : (
                todayTasks.map(task => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onComplete={(id) => completeTask({ taskId: id, completed: !task.completed })}
                    isCompleting={isCompleting}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {/* Week strip */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <WeekStrip tasks={currentWeekTasks} currentDate={new Date()} />
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{stats.weeklyProgress}% complete this week</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> Done</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" /> Partial</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400 inline-block" /> Missed</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity chart */}
          <ProgressChart tasks={[...todayTasks, ...currentWeekTasks]} />
        </div>

        {/* Right: Upcoming + mock scores */}
        <div className="lg:col-span-5 space-y-4">
          <UpcomingTasks tasks={upcomingTasks} />

          {/* Recent mock scores */}
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Mock Scores</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMockScores.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Trophy className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No mock tests taken yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMockScores.map((s, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{s.examType} Mock</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(s.date), "MMM d")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{s.score}</p>
                        <p className="text-xs text-muted-foreground">/ {s.maxScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Milestones */}
      {milestones.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Milestones</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {milestones.map(m => (
              <div
                key={m._id}
                className={cn(
                  "shrink-0 w-56 rounded-2xl border p-4 transition-colors",
                  m.achieved
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800"
                    : "bg-card border-border"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-lg">{m.achieved ? "✅" : "🎯"}</span>
                  <span className="text-xs text-muted-foreground">Week {m.weekNumber}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{m.title}</p>
                {!m.achieved && (
                  <p className="text-xs text-muted-foreground mt-1">
                    By {format(new Date(m.targetDate), "MMM d")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
