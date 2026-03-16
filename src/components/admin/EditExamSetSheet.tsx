"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { examSetUpdateSchema, type ExamSetUpdateData } from "@/validations/examSetSchema"
import { useUpdateExamSet, useAdminExamSetDetail, useManageExamSetSection } from "@/hooks/useExamSets"
import type { IExamSetSummary } from "@/store/slices/mockTestSlice"
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
import { Badge } from "@/components/ui/badge"

interface EditExamSetSheetProps {
  examSet: IExamSetSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditExamSetSheet({ examSet, open, onOpenChange }: EditExamSetSheetProps) {
  const { updateExamSet, isPending } = useUpdateExamSet(examSet._id)
  const { examSet: detail, isLoading: detailLoading } = useAdminExamSetDetail(open ? examSet._id : "")
  const { manageSection, isPending: sectionPending } = useManageExamSetSection(examSet._id)

  const [newSectionName, setNewSectionName] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<ExamSetUpdateData>({
    resolver: zodResolver(examSetUpdateSchema) as any,
  })

  useEffect(() => {
    if (open && examSet) {
      reset({
        name: examSet.name,
        description: examSet.description,
        difficulty: examSet.difficulty,
        timeLimitMins: examSet.timeLimitMins,
      })
    }
  }, [open, examSet, reset])

  const onSubmit = (data: ExamSetUpdateData) => {
    // Only send non-sections fields — sections are managed via PATCH separately
    const { sections: _sections, ...rest } = data
    updateExamSet(rest, {
      onSuccess: () => onOpenChange(false),
    })
  }

  const handleAddSection = () => {
    const name = newSectionName.trim()
    if (!name) return
    manageSection({ action: "add_section", section: name })
    setNewSectionName("")
  }

  const handleRemoveSection = (section: string) => {
    manageSection({ action: "remove_section", section })
  }

  const sections = detail?.sections ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto px-6">
        <SheetHeader className="pt-2 mb-6">
          <SheetTitle>Edit Exam Set</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-8">
          <div className="space-y-2">
            <Label>Exam Type</Label>
            <Input value={examSet.examType} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register("name")} placeholder="e.g. IELTS Full Mock — Set A" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Brief description" rows={3} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={watch("difficulty") ?? examSet.difficulty}
                onValueChange={v => setValue("difficulty", v as "easy" | "medium" | "hard")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy (Weeks 1–4)</SelectItem>
                  <SelectItem value="medium">Medium (Weeks 5–8)</SelectItem>
                  <SelectItem value="hard">Hard (Weeks 9–13)</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Sections — managed live via PATCH */}
          <div className="space-y-3">
            <Label>Sections</Label>

            {/* Existing sections */}
            {detailLoading ? (
              <p className="text-xs text-muted-foreground">Loading sections…</p>
            ) : sections.length === 0 ? (
              <p className="text-xs text-muted-foreground">No sections yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sections.map(s => (
                  <div key={s.section} className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 pl-3 pr-1.5 py-1">
                    <span className="text-sm">{s.section}</span>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">{s.questions.length}q</Badge>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(s.section)}
                      disabled={sectionPending}
                      className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new section */}
            <div className="flex gap-2">
              <Input
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                placeholder="New section name…"
                className="flex-1"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSection() } }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddSection}
                disabled={sectionPending || !newSectionName.trim()}
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
