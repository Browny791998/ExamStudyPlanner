"use client"

import { useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { useCreateCustomQuestion, type CustomQuestionFormData } from "@/hooks/useCustomQuestions"
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
import { Switch } from "@/components/ui/switch"
import { Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const EXAM_SECTIONS: Record<string, string[]> = {
  IELTS: ["Reading", "Writing", "Listening", "Speaking"],
  TOEFL: ["Reading", "Writing", "Listening", "Speaking"],
  JLPT: ["Vocabulary", "Grammar", "Reading", "Listening"],
  SAT: ["Math", "Reading", "Writing"],
}

interface AddCustomQuestionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCustomQuestionSheet({ open, onOpenChange }: AddCustomQuestionSheetProps) {
  const { createQuestion, isPending } = useCreateCustomQuestion()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomQuestionFormData>({
    defaultValues: {
      questionType: "multiple_choice",
      includeInDrills: false,
      tags: [],
    },
  })

  const { fields: blankFields, append: appendBlank, remove: removeBlank } = useFieldArray({
    control,
    name: "blanks" as never,
  })

  const watchedExamType = watch("examType")
  const watchedQuestionType = watch("questionType")

  useEffect(() => {
    if (!open) reset({ questionType: "multiple_choice", includeInDrills: false, tags: [] })
  }, [open, reset])

  const sections = watchedExamType ? EXAM_SECTIONS[watchedExamType] ?? [] : []

  const onSubmit = (data: CustomQuestionFormData) => {
    createQuestion(data, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Add Custom Question</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Question Type *</Label>
              <Controller
                name="questionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => {
                    field.onChange(v)
                    setValue("options", undefined)
                    setValue("correctAnswer", undefined)
                    setValue("blanks", undefined)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Exam Type *</Label>
              <Controller
                name="examType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.examType && "border-destructive")}>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {["IELTS", "TOEFL", "JLPT", "SAT"].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Section *</Label>
              <Controller
                name="section"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={!watchedExamType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Difficulty *</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Passage (optional)</Label>
            <Textarea rows={3} placeholder="Context or reading passage…" {...register("passage")} />
          </div>

          <div className="space-y-1.5">
            <Label>Question *</Label>
            <Textarea
              rows={3}
              placeholder="Enter your question…"
              {...register("question")}
              className={cn(errors.question && "border-destructive")}
            />
            {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
          </div>

          {/* MCQ fields */}
          {watchedQuestionType === "multiple_choice" && (
            <div className="space-y-3">
              {["A", "B", "C", "D"].map((letter, i) => (
                <div key={letter} className="space-y-1">
                  <Label className="text-xs">Option {letter} {i < 2 ? "*" : ""}</Label>
                  <Input placeholder={`Option ${letter}`} {...register(`options.${i}`)} />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label>Correct Answer *</Label>
                <Controller
                  name="correctAnswer"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select correct" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D"].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          )}

          {/* Fill blank fields */}
          {watchedQuestionType === "fill_blank" && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Blanks</Label>
              {blankFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-2 gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Blank {i + 1} Answer *</Label>
                    <Input placeholder="Answer" {...register(`blanks.${i}.answer` as never)} />
                  </div>
                  <div className="flex gap-1 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Hint</Label>
                      <Input placeholder="Hint…" {...register(`blanks.${i}.hint` as never)} />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-destructive shrink-0"
                      onClick={() => removeBlank(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {blankFields.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendBlank({ index: blankFields.length, answer: "", hint: "" } as never)}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Blank
                </Button>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Explanation *</Label>
            <Textarea
              rows={3}
              placeholder="Explanation shown after answering…"
              {...register("explanation")}
              className={cn(errors.explanation && "border-destructive")}
            />
            {errors.explanation && <p className="text-xs text-destructive">{errors.explanation.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Include in my drills</p>
              <p className="text-xs text-muted-foreground">Mix this question into your drill sessions</p>
            </div>
            <Controller
              name="includeInDrills"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Question"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
