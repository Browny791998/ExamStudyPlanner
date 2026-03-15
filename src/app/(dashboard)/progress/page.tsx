'use client'

import { useState } from 'react'
import { useProgressData, useShareCardData } from '@/hooks/useProgress'
import { useSelectedPlan } from '@/hooks/useStudyPlan'
import { ScoreTrendChart } from '@/components/progress/ScoreTrendChart'
import { StudyTimeSkillChart } from '@/components/progress/StudyTimeSkillChart'
import { WeeklyStudyChart } from '@/components/progress/WeeklyStudyChart'
import { SectionBreakdown } from '@/components/progress/SectionBreakdown'
import { WeakAreaAnalysis } from '@/components/progress/WeakAreaAnalysis'
import { MilestoneTracker } from '@/components/progress/MilestoneTracker'
import { TestHistoryTable } from '@/components/progress/TestHistoryTable'
import { PlanComparison } from '@/components/progress/PlanComparison'
import { ShareProgressDialog } from '@/components/progress/ShareProgressDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp, Flame, CalendarDays, Clock,
  Share2, Target,
} from 'lucide-react'

function StatCard({
  title, value, subtitle, icon: Icon, extra,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  extra?: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardContent className="pt-5 pb-4 px-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {extra}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Skeleton className="lg:col-span-7 h-80 rounded-2xl" />
        <Skeleton className="lg:col-span-5 h-80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )
}

export default function ProgressPage() {
  const { selectedPlan } = useSelectedPlan()
  const { data, isLoading } = useProgressData(selectedPlan?._id)
  const { cardData, isLoading: cardLoading } = useShareCardData(selectedPlan?._id)
  const [shareOpen, setShareOpen] = useState(false)

  if (isLoading) return <LoadingSkeleton />

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Target className="h-10 w-10 opacity-30" />
        <p className="text-sm">No progress data yet. Complete some tasks or take a mock test!</p>
      </div>
    )
  }

  const { overview, scoreHistory, sectionBreakdown, weakAreaAnalysis, studyTimeStats, milestones, planComparison } = data

  return (
    <div className="space-y-8 pb-10">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {overview.examType} · Target: {overview.targetScore} · {overview.daysUntilExam} days until exam
          </p>
        </div>
        <Button variant="outline" onClick={() => setShareOpen(true)}>
          <Share2 className="h-4 w-4 mr-2" /> Share Progress
        </Button>
      </div>

      {/* SECTION 1 — Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Progress"
          value={`${overview.overallProgress}%`}
          subtitle={`${overview.totalSessionDays} days studied`}
          icon={Target}
          extra={<Progress value={overview.overallProgress} className="h-1.5 mt-1" />}
        />
        <StatCard
          title="Total Study Time"
          value={overview.totalStudyHours}
          subtitle={`~${studyTimeStats.dailyAvgMins} min/day avg`}
          icon={Clock}
        />
        <StatCard
          title="Current Streak"
          value={`🔥 ${overview.currentStreak}d`}
          subtitle={`Best: ${overview.longestStreak} days`}
          icon={Flame}
        />
        <StatCard
          title="Days Until Exam"
          value={overview.daysUntilExam}
          subtitle={overview.daysUntilExam <= 7 ? '⚠️ Almost there!' : 'Keep going!'}
          icon={CalendarDays}
        />
      </div>

      {/* SECTION 2 — Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Score Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreTrendChart scoreHistory={scoreHistory} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Study Time by Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StudyTimeSkillChart bySkill={studyTimeStats.bySkill} totalStudyHours={overview.totalStudyHours} />
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3 — Section Breakdown + Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionBreakdown sections={sectionBreakdown} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Weak Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <WeakAreaAnalysis weakAreas={weakAreaAnalysis} totalTests={scoreHistory.length} />
          </CardContent>
        </Card>
      </div>

      {/* SECTION 4 — Tabs */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardContent className="pt-4">
          <Tabs defaultValue="study-time">
            <TabsList className="mb-4">
              <TabsTrigger value="study-time">Study Time</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="history">Test History</TabsTrigger>
            </TabsList>

            <TabsContent value="study-time" className="mt-0 space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Weekly Study Hours</p>
                <WeeklyStudyChart byWeek={studyTimeStats.byWeek} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Daily Average</p>
                  <p className="font-semibold mt-0.5">{studyTimeStats.dailyAvgMins} min</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Most Productive Day</p>
                  <p className="font-semibold mt-0.5">{studyTimeStats.mostProductiveDay}</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Longest Session</p>
                  <p className="font-semibold mt-0.5">{studyTimeStats.longestSession} min</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="milestones" className="mt-0">
              <MilestoneTracker milestones={milestones} />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <TestHistoryTable scoreHistory={scoreHistory} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* SECTION 5 — Plan Comparison (multi-plan users only) */}
      {planComparison.length > 1 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-5">
            <PlanComparison plans={planComparison} currentPlanId={selectedPlan?._id} />
          </CardContent>
        </Card>
      )}

      {/* Share Dialog */}
      <ShareProgressDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        cardData={cardData}
        isLoading={cardLoading}
      />
    </div>
  )
}
