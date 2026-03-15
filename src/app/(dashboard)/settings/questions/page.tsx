"use client"

import { useState } from "react"
import { useCustomQuestions, useDeleteCustomQuestion } from "@/hooks/useCustomQuestions"
import { AddCustomQuestionSheet } from "@/components/settings/AddCustomQuestionSheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import { Plus, Trash2, BookOpen } from "lucide-react"
import type { IQuestion } from "@/types/question"

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
}

export default function MyQuestionsPage() {
  const { questions, isLoading } = useCustomQuestions()
  const { deleteQuestion, isPending: isDeleting } = useDeleteCustomQuestion()
  const [addOpen, setAddOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">My Practice Questions</h2>
          <p className="text-sm text-muted-foreground">Add your own questions to practice drills</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Question
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border border-dashed border-border rounded-2xl">
          <BookOpen className="h-8 w-8 opacity-30" />
          <p className="text-sm">No custom questions yet</p>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            Create your first question
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q: IQuestion) => (
            <div
              key={q._id}
              className="flex items-start justify-between gap-3 p-4 rounded-2xl border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{q.question}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{q.examType}</Badge>
                  <span className="text-xs text-muted-foreground capitalize">
                    {q.questionType.replace(/_/g, " ")}
                  </span>
                  <Badge variant={DIFFICULTY_VARIANT[q.difficulty] ?? "outline"} className="text-xs capitalize">
                    {q.difficulty}
                  </Badge>
                  {q.tags.includes("include-in-drills") && (
                    <span className="text-xs text-blue-600">• In drills</span>
                  )}
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive shrink-0"
                onClick={() => setDeleteId(q._id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AddCustomQuestionSheet open={addOpen} onOpenChange={setAddOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your custom question. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteQuestion(deleteId, { onSuccess: () => setDeleteId(null) })
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
