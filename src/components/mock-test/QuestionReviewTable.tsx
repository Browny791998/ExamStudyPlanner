'use client'

import { Fragment } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IMockTestQuestion, IQuestionFull } from '@/types/mockTest'

type ReviewRow = IMockTestQuestion & { questionDetail?: IQuestionFull }

function ResultIcon({ isCorrect }: { isCorrect: boolean | null }) {
  if (isCorrect === true) return <CheckCircle className="h-4 w-4 text-green-500" />
  if (isCorrect === false) return <XCircle className="h-4 w-4 text-red-500" />
  return <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">Essay</span>
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
      {type.replace(/_/g, ' ')}
    </span>
  )
}

function truncate(str: string | undefined, len: number) {
  if (!str) return '—'
  return str.length > len ? str.slice(0, len) + '…' : str
}

interface QuestionReviewTableProps {
  questions: ReviewRow[]
}

export function QuestionReviewTable({ questions }: QuestionReviewTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'isCorrect', desc: false }])
  const [filter, setFilter] = useState<string>('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filtered = useMemo(() => questions.filter(q => {
    if (filter === 'correct') return q.isCorrect === true
    if (filter === 'wrong') return q.isCorrect === false
    if (filter === 'flagged') return q.flagged
    if (filter === 'essay') return q.isCorrect === null
    return true
  }), [questions, filter])

  const columns: ColumnDef<ReviewRow>[] = useMemo(() => [
    { accessorKey: 'order', header: '#', size: 48 },
    {
      id: 'questionType',
      header: 'Type',
      accessorFn: row => row.questionDetail?.questionType ?? '',
      cell: ({ getValue }) => <TypeBadge type={getValue() as string} />,
    },
    {
      id: 'section',
      header: 'Section',
      accessorFn: row => row.questionDetail?.section ?? '—',
    },
    {
      accessorKey: 'userAnswer',
      header: 'Your Answer',
      cell: ({ getValue }) => (
        <span className="text-xs">{truncate(Array.isArray(getValue()) ? (getValue() as string[]).join(', ') : (getValue() as string | null) ?? '—', 40)}</span>
      ),
    },
    {
      id: 'correctAnswer',
      header: 'Correct',
      accessorFn: (row): string => {
        const q = row.questionDetail
        if (!q) return '—'
        const type = q.questionType
        if (type === 'fill_blank' || type === 'fill-blank') {
          return q.blanks?.map(b => b.answer).join(', ') ?? q.correctAnswer ?? '—'
        }
        if (type === 'word_order' || type === 'word-order') {
          const order = q.correctOrder
          if (Array.isArray(order)) return order.join(' ')
          if (typeof order === 'string') return order
          return '—'
        }
        if (type === 'matching') {
          return q.matchingPairs?.map(p => `${p.left} → ${p.right}`).join(', ') ?? '—'
        }
        return q.correctAnswer ?? '—'
      },
      cell: ({ getValue }) => (
        <span className="text-xs">{truncate(getValue() as string, 40)}</span>
      ),
    },
    {
      accessorKey: 'isCorrect',
      header: 'Result',
      cell: ({ getValue }) => <ResultIcon isCorrect={getValue() as boolean | null} />,
    },
    { accessorKey: 'pointsEarned', header: 'Pts', size: 60 },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {['all', 'correct', 'wrong', 'flagged', 'essay'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize',
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th
                    key={h.id}
                    className="text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <Fragment key={row.id}>
                <tr
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {expandedRow === row.id && row.original.questionDetail && (
                  <tr key={`${row.id}-expand`} className="border-t border-border bg-muted/20">
                    <td colSpan={columns.length} className="px-6 py-4 space-y-3">
                      {row.original.questionDetail.passage && (
                        <div className="rounded-xl border border-border p-3 bg-muted/30">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Passage</p>
                          <p className="text-sm leading-relaxed line-clamp-6">{row.original.questionDetail.passage}</p>
                        </div>
                      )}
                      <p className="text-sm font-medium">{row.original.questionDetail.question}</p>
                      {row.original.questionDetail.explanation && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                          <p className="text-xs font-semibold text-amber-700 mb-1">Explanation</p>
                          <p className="text-sm text-amber-800">{row.original.questionDetail.explanation}</p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
