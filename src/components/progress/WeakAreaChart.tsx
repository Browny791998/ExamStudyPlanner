"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface WeakArea {
  subject: string;
  score: number;
}

interface WeakAreaChartProps {
  data: WeakArea[];
}

export function WeakAreaChart({ data }: WeakAreaChartProps) {
  const sorted = [...data].sort((a, b) => a.score - b.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Weak Areas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sorted.length === 0 && (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        )}
        {sorted.map((area) => (
          <div key={area.subject} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{area.subject}</span>
              <span className="text-muted-foreground">{area.score.toFixed(0)}%</span>
            </div>
            <Progress
              value={area.score}
              className={area.score < 50 ? "[&>div]:bg-destructive" : ""}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
