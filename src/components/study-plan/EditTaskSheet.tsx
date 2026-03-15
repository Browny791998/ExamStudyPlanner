"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { useEditTask, useDeleteTask } from "@/hooks/useTaskManagement"
import type { IDailyTask } from "@/types/studyPlan"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { CalendarIcon, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface EditFormValues {
  title: string
  description: string
  skillFocus: IDailyTask["skillFocus"]
  taskType: IDailyTask["taskType"]
  durationMins: number
  scheduledDate: string
  notes: string
}

interface EditTaskSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: IDailyTask | null
}

export function EditTaskSheet({ open, onOpenChange, task }: EditTaskSheetProps) {
  const { editTask, isPending: isEditing } = useEditTask()
  const { deleteTask, isPending: isDeleting } = useDeleteTask()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditFormValues>()

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        skillFocus: task.skillFocus,
        taskType: task.taskType,
        durationMins: task.durationMins,
        scheduledDate: task.scheduledDate,
        notes: task.notes,
      })
    }
  }, [task, reset])

  const onSubmit = (data: EditFormValues) => {
    if (!task) return
    editTask(
      { id: task._id, data },
      { onSuccess: () => onOpenChange(false) }
    )
  }

  const handleDelete = () => {
    if (!task) return
    deleteTask(task._id, {
      onSuccess: () => {
        setConfirmDelete(false)
        onOpenChange(false)
      },
    })
  }

  if (!task) return null

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto px-6">
          <SheetHeader className="pt-2 mb-4">
            <SheetTitle>Edit Task</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Day {task.dayNumber} · Week {task.weekNumber}
              {task.isCustom && (
                <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-100 text-blue-700">
                  custom
                </span>
              )}
            </p>
          </SheetHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
            <div className="space-y-2">
              <Label>Date</Label>
              <Controller
                name="scheduledDate"
                control={control}
                render={({ field }) => {
                  const dateValue = field.value ? new Date(field.value) : new Date()
                  return (
                    <Popover>
                      <PopoverTrigger className="flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(dateValue, "PPP") : "Pick a date"}
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateValue}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                {...register("title", { required: "Title is required" })}
                className={cn(errors.title && "border-destructive")}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skill Focus</Label>
                <Controller
                  name="skillFocus"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Reading", "Writing", "Listening", "Speaking", "Vocabulary", "Grammar", "Math", "Mock Test"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Task Type</Label>
                <Controller
                  name="taskType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
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
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={480}
                {...register("durationMins", { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={2} placeholder="Personal notes…" {...register("notes")} />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Task
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditing}>
                  {isEditing ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{task.title}&rdquo;. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
