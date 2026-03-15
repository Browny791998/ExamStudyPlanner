"use client"

import { useState, useCallback } from "react"
import { useAdminQuestions, useDeleteQuestion } from "@/hooks/useAdminQuestions"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Upload, Download, Pencil, Trash2 } from "lucide-react"
import type { IQuestion } from "@/types/question"
import { AddQuestionSheet } from "@/components/admin/AddQuestionSheet"
import { ImportCSVDialog } from "@/components/admin/ImportCSVDialog"
import { useDebounce } from "@/hooks/useDebounce"
import { useUserExamTypes } from "@/hooks/useStudyPlan"
import axios from "axios"

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
}

const TYPE_COLORS: Record<string, string> = {
  multiple_choice: "bg-blue-100 text-blue-700",
  fill_blank: "bg-green-100 text-green-700",
  true_false_ng: "bg-yellow-100 text-yellow-700",
  word_order: "bg-purple-100 text-purple-700",
  matching: "bg-pink-100 text-pink-700",
  essay: "bg-orange-100 text-orange-700",
  grid_in: "bg-indigo-100 text-indigo-700",
}

export default function AdminQuestionsPage() {
  const [search, setSearch] = useState("")
  const [examType, setExamType] = useState("")
  const [questionType, setQuestionType] = useState("")
  const [difficulty, setDifficulty] = useState("")
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [editQuestion, setEditQuestion] = useState<IQuestion | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  const { questions, total, totalPages, isLoading } = useAdminQuestions({
    search: debouncedSearch || undefined,
    examType: examType || undefined,

    questionType: questionType || undefined,
    difficulty: difficulty || undefined,
    page,
    limit: 20,
  })

  const { deleteQuestion, isPending: isDeleting } = useDeleteQuestion()
  const examTypes = useUserExamTypes()

  const handleDownloadTemplate = useCallback(async (selectedExamType: string) => {
    setDownloadingTemplate(true)
    try {
      const res = await axios.get(`/api/admin/questions/template?examType=${selectedExamType}`, {
        responseType: "blob",
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedExamType}_questions_template.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      setTemplateOpen(false)
    } finally {
      setDownloadingTemplate(false)
    }
  }, [])

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="sm:max-w-xs"
          />
          <Select value={examType || "_all"} onValueChange={(v) => { setExamType(v === "_all" ? "" : String(v)); setPage(1) }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Exams</SelectItem>
              {examTypes.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={questionType || "_all"} onValueChange={(v) => { setQuestionType(v === "_all" ? "" : String(v)); setPage(1) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Question Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Types</SelectItem>
              {[
                { value: "multiple_choice", label: "Multiple Choice" },
                { value: "fill_blank", label: "Fill Blank" },
                { value: "true_false_ng", label: "True/False/NG" },
                { value: "word_order", label: "Word Order" },
                { value: "matching", label: "Matching" },
                { value: "essay", label: "Essay" },
                { value: "grid_in", label: "Grid In" },
              ].map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={difficulty || "_all"} onValueChange={(v) => { setDifficulty(v === "_all" ? "" : String(v)); setPage(1) }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 sm:ml-auto">
            <Button size="sm" variant="outline" onClick={() => setTemplateOpen(true)}>
              <Download className="h-4 w-4 mr-1" /> Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1" /> Import CSV
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Question
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Question</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Exam</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Difficulty</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Points</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-3" colSpan={6}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : questions.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                    No questions found
                  </td>
                </tr>
              ) : (
                questions.map((q) => (
                  <tr
                    key={q._id}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setEditQuestion(q)}
                  >
                    <td className="px-4 py-3">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="block max-w-xs truncate">{q.question}</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-sm">
                          <p>{q.question}</p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{q.examType}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[q.questionType] ?? "bg-muted text-muted-foreground"}`}>
                        {q.questionType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={DIFFICULTY_VARIANT[q.difficulty] ?? "outline"} className="text-xs capitalize">
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{q.points}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditQuestion(q)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(q._id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total} questions total</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-2">
                Page {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Sheets & Dialogs */}
        <AddQuestionSheet
          open={addOpen}
          onOpenChange={setAddOpen}
        />

        {editQuestion && (
          <AddQuestionSheet
            open={!!editQuestion}
            onOpenChange={(open) => { if (!open) setEditQuestion(null) }}
            question={editQuestion}
          />
        )}

        <ImportCSVDialog open={importOpen} onOpenChange={setImportOpen} />

        {/* Template exam type picker */}
        <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Download CSV Template</DialogTitle>
              <DialogDescription>
                Choose an exam type to download a template with all 7 question type examples.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {examTypes.map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  className="h-14 text-base font-semibold"
                  disabled={downloadingTemplate}
                  onClick={() => handleDownloadTemplate(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Question?</AlertDialogTitle>
              <AlertDialogDescription>
                This will soft-delete the question. It won&apos;t appear in any lists but can be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteId) {
                    deleteQuestion(deleteId, { onSuccess: () => setDeleteId(null) })
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
