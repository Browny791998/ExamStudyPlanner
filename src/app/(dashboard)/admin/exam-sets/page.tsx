"use client"

import { useState } from "react"
import { useAdminExamSets, useDeleteExamSet, usePublishExamSet } from "@/hooks/useExamSets"
import { Button } from "@/components/ui/button"
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
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from "lucide-react"
import type { IExamSetSummary } from "@/store/slices/mockTestSlice"
import { CreateExamSetSheet } from "@/components/admin/CreateExamSetSheet"
import { EditExamSetSheet } from "@/components/admin/EditExamSetSheet"
import { ManageExamSetSheet } from "@/components/admin/ManageExamSetSheet"

const DIFFICULTY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  easy: "secondary",
  medium: "default",
  hard: "destructive",
}

export default function AdminExamSetsPage() {
  const [examTypeFilter, setExamTypeFilter] = useState<string>("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("")
  const [createOpen, setCreateOpen] = useState(false)
  const [editSet, setEditSet] = useState<IExamSetSummary | null>(null)
  const [manageSet, setManageSet] = useState<IExamSetSummary | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<IExamSetSummary | null>(null)

  const { sets, total, isLoading } = useAdminExamSets({
    examType: examTypeFilter || undefined,
    difficulty: difficultyFilter || undefined,
  })
  const { deleteExamSet, isPending: isDeleting } = useDeleteExamSet()
  const { publishExamSet, isPending: isPublishing } = usePublishExamSet()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exam Sets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} exam set{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Exam Set
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={examTypeFilter || "all"} onValueChange={v => setExamTypeFilter(!v || v === "all" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Exam Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IELTS">IELTS</SelectItem>
            <SelectItem value="TOEFL">TOEFL</SelectItem>
            <SelectItem value="JLPT">JLPT</SelectItem>
            <SelectItem value="SAT">SAT</SelectItem>
          </SelectContent>
        </Select>

        <Select value={difficultyFilter || "all"} onValueChange={v => setDifficultyFilter(!v || v === "all" ? "" : v)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Exam</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Difficulty</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Questions</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uses</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-border">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : sets.map((set) => (
                  <tr key={set._id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{set.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{set.examType}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={DIFFICULTY_VARIANT[set.difficulty] ?? "outline"}>
                        {set.difficulty}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{set.totalQuestions}</td>
                    <td className="px-4 py-3 text-muted-foreground">{set.timeLimitMins} min</td>
                    <td className="px-4 py-3">
                      {set.isPublished ? (
                        <Badge variant="secondary" className="text-green-700 bg-green-100">Published</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{set.usageCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Manage Questions"
                          onClick={() => setManageSet(set)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title={set.isPublished ? "Unpublish" : "Publish"}
                          disabled={isPublishing}
                          onClick={() => publishExamSet({ id: set._id, action: set.isPublished ? "unpublish" : "publish" })}
                        >
                          {set.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditSet(set)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(set)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            {!isLoading && sets.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  No exam sets found. Create your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreateExamSetSheet open={createOpen} onOpenChange={setCreateOpen} />
      {manageSet && (
        <ManageExamSetSheet
          examSet={manageSet}
          open={!!manageSet}
          onOpenChange={(o) => { if (!o) setManageSet(null) }}
        />
      )}
      {editSet && (
        <EditExamSetSheet
          examSet={editSet}
          open={!!editSet}
          onOpenChange={(o) => { if (!o) setEditSet(null) }}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Set</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => {
                if (deleteTarget) {
                  deleteExamSet(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
