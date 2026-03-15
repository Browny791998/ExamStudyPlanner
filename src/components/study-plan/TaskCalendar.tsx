"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { isSameDay } from "date-fns";
import type { IDailyTask } from "@/types/studyPlan";

interface TaskCalendarProps {
  tasks: IDailyTask[];
}

export function TaskCalendar({ tasks }: TaskCalendarProps) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const dayTasks = tasks.filter(
    (t) => selected && isSameDay(new Date(t.scheduledDate), selected)
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        className="rounded-md border"
        modifiers={{
          hasTasks: tasks.map((t) => new Date(t.scheduledDate)),
        }}
        modifiersClassNames={{ hasTasks: "font-bold text-primary" }}
      />
      <Card className="flex-1">
        <CardContent className="pt-4 space-y-2">
          {dayTasks.length === 0 && (
            <p className="text-muted-foreground text-sm">No tasks for this day.</p>
          )}
          {dayTasks.map((task) => (
            <div key={task._id} className="flex items-center justify-between">
              <span className="text-sm">{task.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{task.durationMinutes}m</Badge>
                <Badge variant={task.completed ? "secondary" : "default"}>
                  {task.completed ? "Done" : "Pending"}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
