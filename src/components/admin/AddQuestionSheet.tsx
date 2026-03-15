"use client"

import { useEffect } from "react"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { questionSchema, questionUpdateSchema, type QuestionFormData } from "@/validations/questionSchema"
import { useCreateQuestion, useUpdateQuestion } from "@/hooks/useAdminQuestions"
import type { IQuestion } from "@/types/question"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { cn } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useUserExamTypes } from "@/hooks/useStudyPlan"

const EXAM_SECTIONS: Record<string, string[]> = {
  IELTS: ["Reading", "Writing", "Listening", "Speaking"],
  TOEFL: ["Reading", "Writing", "Listening", "Speaking"],
  JLPT: ["Vocabulary", "Grammar", "Reading", "Listening"],
  SAT: ["Math", "Reading", "Writing"],
}

interface AddQuestionSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question?: IQuestion
}

export function AddQuestionSheet({ open, onOpenChange, question }: AddQuestionSheetProps) {
  const isEdit = !!question
  const { createQuestion, isPending: isCreating } = useCreateQuestion()
  const { updateQuestion, isPending: isUpdating } = useUpdateQuestion()
  const isPending = isCreating || isUpdating
  const examTypes = useUserExamTypes()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<QuestionFormData>({
    resolver: zodResolver(isEdit ? questionUpdateSchema : questionSchema) as any,
    defaultValues: {
      examType: undefined,
      section: undefined,
      questionType: undefined,
      difficulty: undefined,
      points: 1,
      tags: [],
      correctAnswer: "",
    },
  })

  const { fields: blankFields, append: appendBlank, remove: removeBlank } = useFieldArray({
    control,
    name: "blanks",
  })

  const { fields: pairFields, append: appendPair, remove: removePair } = useFieldArray({
    control,
    name: "matchingPairs",
  })

  const watchedExamType = watch("examType")
  const watchedQuestionType = watch("questionType")

  useEffect(() => {
    if (!open) return
    if (question) {
      reset({
        examType: question.examType,
        section: question.section,
        questionType: question.questionType,
        difficulty: question.difficulty,
        points: question.points,
        question: question.question,
        passage: question.passage,
        options: question.options,
        blanks: question.blanks,
        words: question.words,
        correctAnswer: question.correctAnswer ?? "",
        correctOrder: question.correctOrder,
        matchingPairs: question.matchingPairs,
        explanation: question.explanation,
        tags: question.tags,
      })
    } else {
      reset({
        examType: undefined,
        section: undefined,
        questionType: undefined,
        difficulty: undefined,
        points: 1,
        tags: [],
        correctAnswer: "",
      })
    }
  }, [open, question, reset])

  // Reset answer fields when question type changes
  useEffect(() => {
    if (!question) {
      setValue("options", undefined)
      setValue("blanks", undefined)
      setValue("words", undefined)
      setValue("correctAnswer", undefined)
      setValue("correctOrder", undefined)
      setValue("matchingPairs", undefined)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedQuestionType])

  const onSubmit = (data: QuestionFormData) => {
    if (isEdit && question) {
      updateQuestion(
        { id: question._id, data },
        { onSuccess: () => { reset(); onOpenChange(false) } }
      )
    } else {
      createQuestion(data, {
        onSuccess: () => { reset(); onOpenChange(false) },
      })
    }
  }

  const onError = (errs: unknown) => {
    console.error("[AddQuestionSheet] validation errors:", errs)
  }

  const standardSections = watchedExamType ? EXAM_SECTIONS[watchedExamType] ?? [] : []
  const isCustomExamType = watchedExamType ? !EXAM_SECTIONS[watchedExamType] : false

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto px-6">
        <SheetHeader className="mb-6 pt-2">
          <SheetTitle>{isEdit ? "Edit Question" : "Add Question"}</SheetTitle>
          {isEdit && question && (
            <SheetDescription>
              Last updated: {format(new Date(question.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </SheetDescription>
          )}
        </SheetHeader>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <form onSubmit={handleSubmit(onSubmit as any, onError)} className="space-y-6 pb-10">
          {/* Step 1: Metadata */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Controller
                name="examType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={(v) => { field.onChange(v); setValue("section", "") }}>
                    <SelectTrigger className={cn(errors.examType && "border-destructive")}>
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      {examTypes.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.examType && <p className="text-xs text-destructive">{errors.examType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Section *</Label>
              {isCustomExamType ? (
                <Input
                  placeholder="e.g. Chapter 1, Module A…"
                  {...register("section")}
                  disabled={!watchedExamType}
                  className={cn(errors.section && "border-destructive")}
                />
              ) : (
                <Controller
                  name="section"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={!watchedExamType}>
                      <SelectTrigger className={cn(errors.section && "border-destructive")}>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {standardSections.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
              {errors.section && <p className="text-xs text-destructive">{errors.section.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Question Type *</Label>
              <Controller
                name="questionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.questionType && "border-destructive")}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: "multiple_choice", label: "Multiple Choice" },
                        { value: "fill_blank", label: "Fill in the Blank" },
                        { value: "true_false_ng", label: "True / False / Not Given" },
                        { value: "word_order", label: "Word Order" },
                        { value: "matching", label: "Matching" },
                        { value: "essay", label: "Essay" },
                        { value: "grid_in", label: "Grid In" },
                      ].map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.questionType && <p className="text-xs text-destructive">{errors.questionType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Difficulty *</Label>
              <Controller
                name="difficulty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger className={cn(errors.difficulty && "border-destructive")}>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Points</Label>
              <Input
                type="number"
                min={0}
                max={10}
                {...register("points", { valueAsNumber: true })}
                className={cn(errors.points && "border-destructive")}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="academic, reading, vocabulary"
                defaultValue={question?.tags?.join(", ") ?? ""}
                onChange={(e) => {
                  const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                  setValue("tags", tags)
                }}
              />
            </div>
          </div>

          {/* Step 2: Content */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Passage (optional)</Label>
              <Textarea
                rows={4}
                placeholder="Reading passage or context…"
                {...register("passage")}
              />
            </div>

            <div className="space-y-2">
              <Label>Question Text *</Label>
              <Textarea
                rows={3}
                placeholder="Enter the question…"
                {...register("question")}
                className={cn(errors.question && "border-destructive")}
              />
              {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
            </div>
          </div>

          {/* Step 3: Answer fields - dynamic */}
          {watchedQuestionType === "multiple_choice" && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Answer Options</Label>
              {["A", "B", "C", "D"].map((letter, i) => (
                <div key={letter} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Option {letter} {i < 2 ? "*" : ""}</Label>
                  <Input
                    placeholder={`Option ${letter}`}
                    {...register(`options.${i}`)}
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Correct Answer *</Label>
                <Controller
                  name="correctAnswer"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger className={cn(errors.correctAnswer && "border-destructive")}>
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D"].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.correctAnswer && <p className="text-xs text-destructive">{errors.correctAnswer.message}</p>}
              </div>
            </div>
          )}

          {watchedQuestionType === "true_false_ng" && (
            <div className="space-y-2">
              <Label>Correct Answer *</Label>
              <Controller
                name="correctAnswer"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-2">
                    {["TRUE", "FALSE", "NOT GIVEN"].map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant={field.value === v ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.onChange(v)}
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                )}
              />
              {errors.correctAnswer && <p className="text-xs text-destructive">{errors.correctAnswer.message}</p>}
            </div>
          )}

          {watchedQuestionType === "fill_blank" && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Blanks</Label>
              {blankFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-2 gap-3 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Blank {i + 1} Answer *</Label>
                    <Input
                      placeholder="Correct answer"
                      {...register(`blanks.${i}.answer`)}
                    />
                    <input type="hidden" {...register(`blanks.${i}.index`, { valueAsNumber: true })} value={i} />
                  </div>
                  <div className="flex gap-1 items-end">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs">Hint (optional)</Label>
                      <Input placeholder="Hint…" {...register(`blanks.${i}.hint`)} />
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
                  onClick={() => appendBlank({ index: blankFields.length, answer: "", hint: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Blank
                </Button>
              )}
            </div>
          )}

          {watchedQuestionType === "word_order" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Words (space or comma separated) *</Label>
                <Input
                  placeholder="the quick brown fox jumps"
                  onChange={(e) => {
                    const words = e.target.value
                      .split(/[,\s]+/)
                      .map((w) => w.trim())
                      .filter(Boolean)
                    setValue("words", words)
                  }}
                  defaultValue={question?.words?.join(" ") ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Correct Order *</Label>
                <Input
                  placeholder="I give the ball to Mg Mg"
                  onChange={(e) => {
                    const order = e.target.value
                      .split(/[,\s]+/)
                      .map((w) => w.trim())
                      .filter(Boolean)
                    setValue("correctOrder", order)
                  }}
                  defaultValue={question?.correctOrder?.join(" ") ?? ""}
                />
                <p className="text-xs text-muted-foreground">Enter the correct sentence (words in correct order)</p>
              </div>
            </div>
          )}

          {watchedQuestionType === "grid_in" && (
            <div className="space-y-2">
              <Label>Correct Answer (numeric) *</Label>
              <Input
                type="text"
                placeholder="e.g. 42 or 3.14"
                {...register("correctAnswer")}
                className={cn(errors.correctAnswer && "border-destructive")}
              />
              {errors.correctAnswer && <p className="text-xs text-destructive">{errors.correctAnswer.message}</p>}
            </div>
          )}

          {watchedQuestionType === "matching" && (
            <div className="space-y-4">
              <Label className="text-sm font-semibold">Matching Pairs</Label>
              {pairFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-2 gap-3 items-center">
                  <Input placeholder="Left side" {...register(`matchingPairs.${i}.left`)} />
                  <div className="flex gap-1">
                    <Input placeholder="Right side" {...register(`matchingPairs.${i}.right`)} />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-destructive shrink-0"
                      onClick={() => removePair(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {pairFields.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPair({ left: "", right: "" })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Pair
                </Button>
              )}
            </div>
          )}

          {/* Step 4: Explanation */}
          <div className="space-y-2">
            <Label>Explanation *</Label>
            <Textarea
              rows={3}
              placeholder="Shown to students after answering…"
              {...register("explanation")}
              className={cn(errors.explanation && "border-destructive")}
            />
            {errors.explanation && <p className="text-xs text-destructive">{errors.explanation.message}</p>}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Question"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
