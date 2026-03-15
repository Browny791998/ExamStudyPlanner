"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import type { IStudyPlan } from "@/types/studyPlan";

interface PlanCardProps {
  plan: IStudyPlan;
  onClick?: () => void;
}

const statusVariant: Record<IStudyPlan["status"], "default" | "secondary" | "outline"> = {
  active: "default",
  completed: "secondary",
  paused: "outline",
};

export function PlanCard({ plan, onClick }: PlanCardProps) {
  const progress = plan.overallProgress ?? 0;

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{plan.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(plan.startDate), "MMM d")} →{" "}
            {format(new Date(plan.endDate), "MMM d, yyyy")}
          </p>
        </div>
        <Badge variant={statusVariant[plan.status]}>{plan.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{plan.examType.toUpperCase()}</span>
          <span>{progress}% complete</span>
        </div>
        <Progress value={progress} />
      </CardContent>
    </Card>
  );
}
