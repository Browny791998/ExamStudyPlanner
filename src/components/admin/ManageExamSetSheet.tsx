"use client"

import { useState } from "react"
import { useAdminExamSetDetail, useManageExamSetQuestions } from "@/hooks/useExamSets"
import { useAdminQuestions } from "@/hooks/useAdminQuestions"
import type { IExamSetSummary } from "@/store/slices/mockTestSlice"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "text-green-700 bg-green-100",
  medium: "text-yellow-700 bg-yellow-100",
  hard: "text-red-700 bg-red-100",
}

interface ManageExamSetSheetProps {
  examSet: IExamSetSummary
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageExamSetSheet({ examSet, open, onOpenChange }: ManageExamSetSheetProps) {
  const [activeSection, setActiveSection] = useState("")
  const [search, setSearch] = useState("")
  const [questionTypeFilter, setQuestionTypeFilter] = useState("")

  const { examSet: detail, isLoading: detailLoading } = useAdminExamSetDetail(open ? examSet._id : "")
  const { manageQuestions, isPending } = useManageExamSetQuestions(examSet._id)

  const { questions, isLoading: questionsLoading } = useAdminQuestions({
    examType: examSet.examType,
    search: search || undefined,
    questionType: questionTypeFilter || undefined,
    limit: 50,
  })

  const currentSection = detail?.sections.find(s => s.section === activeSection)
  const assignedIds = new Set(currentSection?.questions.map(q => q._id) ?? [])

  const handleAdd = (questionId: string) => {
    if (!activeSection) return
    manageQuestions({ action: "add_questions", section: activeSection, questionIds: [questionId] })
  }

  const handleRemove = (questionId: string) => {
    if (!activeSection) return
    manageQuestions({ action: "remove_questions", section: activeSection, questionIds: [questionId] })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="!w-[90vw] !max-w-[90vw] flex flex-col h-full overflow-hidden p-0">
        <SheetHeader className="px-8 pt-7 pb-5 border-b border-border shrink-0">
          <SheetTitle className="text-xl">
            Manage Questions{" "}
            <span className="text-muted-foreground font-normal">— {examSet.name}</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Section sidebar */}
          <div className="w-52 shrink-0 border-r border-border flex flex-col bg-muted/20">
            <p className="text-xs font-semibold text-muted-foreground px-4 pt-5 pb-3 uppercase tracking-wider">
              Sections
            </p>
            {detailLoading ? (
              <div className="space-y-2 px-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1 px-3 pb-4">
                {detail?.sections.map(s => (
                  <button
                    key={s.section}
                    onClick={() => setActiveSection(s.section || "")}
                    className={cn(
                      "w-full text-left rounded-lg px-4 py-3 transition-colors",
                      activeSection === s.section
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <span className="block text-sm font-medium truncate">{s.section}</span>
                    <span className={cn(
                      "text-xs mt-0.5 block",
                      activeSection === s.section ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {s.questions.length} question{s.questions.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
                {detail?.sections.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 py-2">
                    No sections. Add them in Edit.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Main panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!activeSection ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Select a section to manage its questions.
              </div>
            ) : (
              <>
                {/* Assigned questions */}
                <div className="px-6 pt-6 pb-5 border-b border-border shrink-0">
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-base font-semibold">
                      Assigned to &quot;{activeSection}&quot;
                    </p>
                    <span className="text-sm text-muted-foreground">
                      ({currentSection?.questions.length ?? 0})
                    </span>
                  </div>
                  {detailLoading ? (
                    <Skeleton className="h-14 w-full rounded-lg" />
                  ) : currentSection?.questions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No questions assigned yet.</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {currentSection?.questions.map(q => (
                        <div
                          key={q._id}
                          className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
                        >
                          <span className="flex-1 text-sm truncate">{q.question}</span>
                          <Badge className={cn("text-xs shrink-0 px-2 py-0.5", DIFFICULTY_COLORS[q.difficulty])}>
                            {q.difficulty}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                            disabled={isPending}
                            onClick={() => handleRemove(q._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Question browser */}
                <div className="flex-1 flex flex-col overflow-hidden px-6 pt-5">
                  <p className="text-base font-semibold mb-4">Add Questions</p>

                  {/* Filters */}
                  <div className="flex gap-3 mb-4 shrink-0">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        className="pl-9 h-10"
                        placeholder="Search questions…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                      />
                    </div>
                    <Select
                      value={questionTypeFilter || "all"}
                      onValueChange={v => setQuestionTypeFilter(!v || v === "all" ? "" : v)}
                    >
                      <SelectTrigger className="w-44 h-10">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                        <SelectItem value="fill_blank">Fill Blank</SelectItem>
                        <SelectItem value="true_false_ng">True / False / NG</SelectItem>
                        <SelectItem value="word_order">Word Order</SelectItem>
                        <SelectItem value="matching">Matching</SelectItem>
                        <SelectItem value="essay">Essay</SelectItem>
                        <SelectItem value="grid_in">Grid In</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Question list */}
                  <div className="flex-1 overflow-y-auto space-y-2 pb-6 pr-1">
                    {questionsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))
                    ) : questions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-12">
                        No questions found.
                      </p>
                    ) : (
                      questions.map(q => {
                        const already = assignedIds.has(q._id)
                        return (
                          <div
                            key={q._id}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
                              already
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-card hover:bg-muted/30"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{q.question}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground capitalize">
                                  {q.questionType.replace(/_/g, " ")}
                                </span>
                                <span className="text-muted-foreground text-xs">·</span>
                                <Badge className={cn("text-xs px-2 py-0", DIFFICULTY_COLORS[q.difficulty])}>
                                  {q.difficulty}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              variant={already ? "secondary" : "outline"}
                              size="sm"
                              className="h-8 px-3 text-sm shrink-0"
                              disabled={isPending || already}
                              onClick={() => handleAdd(q._id)}
                            >
                              {already ? "Added" : <><Plus className="h-3.5 w-3.5 mr-1" />Add</>}
                            </Button>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
