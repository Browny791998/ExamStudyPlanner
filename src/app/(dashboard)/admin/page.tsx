"use client"

import { useAdminStats } from "@/hooks/useAdminQuestions"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { BookOpen, Users, ClipboardList, FileCheck } from "lucide-react"

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
}

export default function AdminStatsPage() {
  const { stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: "Total Questions", value: stats.totalQuestions, icon: BookOpen },
    { label: "Total Users", value: stats.totalUsers, icon: Users },
    { label: "Active Plans", value: stats.activeStudyPlans, icon: ClipboardList },
    { label: "Mock Tests Taken", value: stats.totalMockTests, icon: FileCheck },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-2xl">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs">{label}</span>
              </div>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Questions by Exam Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.questionsByExam.map(({ examType, count }) => (
              <div key={examType} className="flex items-center justify-between">
                <span className="text-sm">{examType}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {stats.questionsByExam.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Questions by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.questionsByType.map(({ questionType, count }) => (
              <div key={questionType} className="flex items-center justify-between">
                <span className="text-sm capitalize">{questionType.replace(/_/g, " ")}</span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {stats.questionsByType.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Recent Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentQuestions.map((q) => (
              <div key={q._id} className="flex items-center justify-between gap-2 py-1">
                <span className="text-sm truncate flex-1">{q.question}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant="outline" className="text-xs">{q.examType}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{q.questionType.replace(/_/g, " ")}</Badge>
                  <Badge variant={DIFFICULTY_VARIANT[q.difficulty] ?? "outline"} className="text-xs">
                    {q.difficulty}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {format(new Date(q.createdAt), "MMM d")}
                  </span>
                </div>
              </div>
            ))}
            {stats.recentQuestions.length === 0 && (
              <p className="text-sm text-muted-foreground">No questions yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
