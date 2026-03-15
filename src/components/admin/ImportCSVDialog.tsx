"use client"

import { useState, useCallback } from "react"
import Papa from "papaparse"
import { questionSchema } from "@/validations/questionSchema"
import { useImportQuestions } from "@/hooks/useAdminQuestions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ParsedRow {
  rowNum: number
  data: Record<string, string>
  valid: boolean
  error?: string
}

interface ImportCSVDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function parseRow(row: Record<string, string>) {
  const rawOptions = row.options ? row.options.split('|').map((s: string) => s.trim()).filter(Boolean) : []
  const tags = row.tags ? row.tags.split('|').map((s: string) => s.trim()).filter(Boolean) : []
  const points = row.points ? parseFloat(row.points) : 1
  const questionType = row.questionType?.trim()
  const correctAnswer = row.correctAnswer?.trim() || undefined

  const words = questionType === 'word_order' ? rawOptions : undefined
  const correctOrder = questionType === 'word_order' && correctAnswer
    ? correctAnswer.split(' ').map((s: string) => s.trim()).filter(Boolean)
    : undefined

  const blanks = questionType === 'fill_blank' && correctAnswer
    ? [{ index: 0, answer: correctAnswer }]
    : undefined

  const matchingPairs = questionType === 'matching' && rawOptions.length
    ? rawOptions.map((pair: string) => {
        const sep = pair.indexOf(':')
        return sep > -1
          ? { left: pair.slice(0, sep).trim(), right: pair.slice(sep + 1).trim() }
          : { left: pair.trim(), right: '' }
      }).filter((p: { left: string; right: string }) => p.left && p.right)
    : undefined

  const options = (questionType !== 'word_order' && rawOptions.length) ? rawOptions : undefined

  return {
    examType: row.examType?.trim(),
    section: row.section?.trim(),
    questionType,
    difficulty: row.difficulty?.trim(),
    points,
    question: row.question?.trim(),
    passage: row.passage?.trim() || undefined,
    options,
    words,
    correctAnswer: (questionType === 'fill_blank' || questionType === 'word_order') ? undefined : correctAnswer,
    correctOrder,
    blanks,
    matchingPairs,
    explanation: row.explanation?.trim() || undefined,
    tags,
  }
}

export function ImportCSVDialog({ open, onOpenChange }: ImportCSVDialogProps) {
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const { importQuestions, isPending } = useImportQuestions()

  const processFile = useCallback((f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => {
      const rawText = (e.target?.result as string) ?? ''
      // Strip UTF-8 BOM and comment lines (lines starting with #)
      const text = rawText
        .replace(/^\uFEFF/, '')
        .split('\n')
        .filter(line => !line.trimStart().startsWith('#'))
        .join('\n')

      const { data } = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      })

      const parsed: ParsedRow[] = data.map((row, i) => {
        const result = questionSchema.safeParse(parseRow(row))
        return {
          rowNum: i + 2,
          data: row,
          valid: result.success,
          error: result.success
            ? undefined
            : result.error.issues.map((e: { message: string }) => e.message).join('; '),
        }
      })
      setRows(parsed)
    }
    reader.readAsText(f, 'utf-8')
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (f?.name.endsWith('.csv')) processFile(f)
    },
    [processFile]
  )

  const validCount = rows.filter((r) => r.valid).length
  const invalidCount = rows.filter((r) => !r.valid).length

  const handleImport = () => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    importQuestions(formData, {
      onSuccess: () => {
        setRows([])
        setFile(null)
        onOpenChange(false)
      },
    })
  }

  const handleClose = () => {
    setRows([])
    setFile(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[90vw] max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Questions from CSV</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
            onClick={() => document.getElementById('csv-file-input')?.click()}
          >
            <input
              id="csv-file-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
              }}
            />
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Drop CSV file here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Only .csv files accepted</p>
            {file && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span>{file.name}</span>
                {rows.length > 0 && (
                  <span className="text-muted-foreground">— Found {rows.length} rows</span>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" /> {validCount} valid
                </span>
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" /> {invalidCount} invalid
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  Only valid rows will be imported
                </span>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Row</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Exam</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Question</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row) => (
                      <tr key={row.rowNum} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">{row.rowNum}</td>
                        <td className="px-3 py-2">{row.data.examType}</td>
                        <td className="px-3 py-2">{row.data.questionType}</td>
                        <td className="px-3 py-2 max-w-[200px] truncate">{row.data.question}</td>
                        <td className="px-3 py-2">
                          {row.valid ? (
                            <Badge variant="secondary" className="text-green-700 bg-green-100 text-xs">
                              Valid
                            </Badge>
                          ) : (
                            <span className="text-destructive text-xs">Invalid: {row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/20">
                    Showing 10 of {rows.length} rows
                  </div>
                )}
              </div>
            </>
          )}

          {isPending && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Importing questions…</p>
              <Progress value={null} className="h-2" />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={validCount === 0 || isPending}
          >
            {isPending ? "Importing…" : `Import ${validCount} Valid Question${validCount !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
