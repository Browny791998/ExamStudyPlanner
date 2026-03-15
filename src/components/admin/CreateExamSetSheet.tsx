"use client"

import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { examSetSchema, type ExamSetFormData } from "@/validations/examSetSchema"
import { useCreateExamSet } from "@/hooks/useExamSets"
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
import { Plus, Trash2 } from "lucide-react"
import { EXAM_SET_CONFIG } from "@/constants/questionTypes"
import { useUserExamTypes } from "@/hooks/useStudyPlan"

interface CreateExamSetSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateExamSetSheet({ open, onOpenChange }: CreateExamSetSheetProps) {
  const { createExamSet, isPending } = useCreateExamSet()
  const examTypes = useUserExamTypes()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ExamSetFormData>({
    resolver: zodResolver(examSetSchema) as any,
    defaultValues: {
      sections: [],
      timeLimitMins: 180,
    },
  })

  const { fields: sectionFields, append: appendSection, remove: removeSection, replace: replaceSections } = useFieldArray({
    control,
    name: "sections",
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    createExamSet(data as ExamSetFormData, {
      onSuccess: () => {
        reset()
        onOpenChange(false)
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto px-6">
        <SheetHeader className="pt-2 mb-6">
          <SheetTitle>Create Exam Set</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pb-8">
          <div className="space-y-1.5">
            <Label>Exam Type</Label>
            <Controller
              control={control}
              name="examType"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v)
                    const config = EXAM_SET_CONFIG[v as keyof typeof EXAM_SET_CONFIG]
                    if (config) {
                      replaceSections(config.sections.map(s => ({ section: s, questions: [] })))
                      setValue("timeLimitMins", config.full.timeMins)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam type" />
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

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. IELTS Full Mock — Set A" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Brief description of this exam set" rows={2} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Controller
                control={control}
                name="difficulty"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy (Weeks 1–4)</SelectItem>
                      <SelectItem value="medium">Medium (Weeks 5–8)</SelectItem>
                      <SelectItem value="hard">Hard (Weeks 9–13)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Time Limit (mins)</Label>
              <Input
                type="number"
                {...register("timeLimitMins", { valueAsNumber: true })}
                min={10}
                max={360}
              />
              {errors.timeLimitMins && <p className="text-xs text-destructive">{errors.timeLimitMins.message}</p>}
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sections</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendSection({ section: "", questions: [] })}
              >
                <Plus className="h-3 w-3 mr-1" /> Add Section
              </Button>
            </div>
            {sectionFields.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Select an exam type to auto-populate sections, or add manually.
              </p>
            )}
            <div className="space-y-2">
              {sectionFields.map((field, idx) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      {...register(`sections.${idx}.section`)}
                      placeholder="Section name"
                    />
                    {errors.sections?.[idx]?.section && (
                      <p className="text-xs text-destructive">{errors.sections[idx]?.section?.message}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive mt-0"
                    onClick={() => removeSection(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {errors.sections && !Array.isArray(errors.sections) && (
              <p className="text-xs text-destructive">{errors.sections.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create Exam Set"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
