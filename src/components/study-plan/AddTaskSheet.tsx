"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { dailyTaskSchema, type DailyTaskFormData } from "@/validations/questionSchema"
import { useAddTask } from "@/hooks/useStudyPlan"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AddTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId?: string
  planStartDate?: string
  planEndDate?: string
  defaultDate?: Date
}

export function AddTaskSheet({ open, onOpenChange, planId, defaultDate }: AddTaskSheetProps) {
  const { addTask, isPending } = useAddTask()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DailyTaskFormData>({
    resolver: zodResolver(dailyTaskSchema),
    defaultValues: {
      scheduledDate: defaultDate ? defaultDate.toISOString() : new Date().toISOString(),
      skillFocus: "Reading",
      taskType: "drill",
      durationMins: 30,
    },
  })

  useEffect(() => {
    if (planId) setValue("planId", planId)
  }, [planId, setValue])

  useEffect(() => {
    if (defaultDate) setValue("scheduledDate", defaultDate.toISOString())
  }, [defaultDate, setValue])

  const onSubmit = (data: DailyTaskFormData) => {
    addTask(data, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
        <SheetHeader className="mb-6 pt-2">
          <SheetTitle>Add Task</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
          <input type="hidden" {...register("planId")} />

          <div className="space-y-2">
            <Label>Date *</Label>
            <Controller
              name="scheduledDate"
              control={control}
              render={({ field }) => {
                const dateValue = field.value ? new Date(field.value) : new Date()
                return (
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm text-left font-normal",
                        !field.value && "text-muted-foreground",
                        errors.scheduledDate && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(dateValue, "PPP") : "Pick a date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateValue}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )
              }}
            />
            {errors.scheduledDate && (
              <p className="text-xs text-destructive">{errors.scheduledDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Reading Comprehension Drill"
              {...register("title")}
              className={cn(errors.title && "border-destructive")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={2}
              placeholder="Optional notes…"
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Skill Focus *</Label>
              <Controller
                name="skillFocus"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.skillFocus && "border-destructive")}>
                      <SelectValue placeholder="Select skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Reading", "Writing", "Listening", "Speaking",
                        "Vocabulary", "Grammar", "Math", "Mock Test",
                        "Study", "Review", "Practice", "Other",
                      ].map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.skillFocus && <p className="text-xs text-destructive">{errors.skillFocus.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Task Type *</Label>
              <Controller
                name="taskType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.taskType && "border-destructive")}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drill">Drill</SelectItem>
                      <SelectItem value="mock_test">Mock Test</SelectItem>
                      <SelectItem value="revision">Revision</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.taskType && <p className="text-xs text-destructive">{errors.taskType.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duration (minutes) *</Label>
            <Input
              type="number"
              min={5}
              max={480}
              placeholder="60"
              {...register("durationMins", { valueAsNumber: true })}
              className={cn(errors.durationMins && "border-destructive")}
            />
            {errors.durationMins && <p className="text-xs text-destructive">{errors.durationMins.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding…" : "Add Task"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
