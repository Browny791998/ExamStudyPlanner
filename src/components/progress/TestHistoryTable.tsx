'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import type { ScoreHistoryItem } from '@/types/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  scoreHistory: ScoreHistoryItem[]
}

const MODE_LABELS: Record<string, string> = { full: 'Full Test', section: 'Section', drill: 'Drill' }
const MODE_COLORS: Record<string, string> = {
  full: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  section: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  drill: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
}

type FilterMode = 'all' | 'full' | 'section' | 'drill' | 'retake'

const helper = createColumnHelper<ScoreHistoryItem>()

export function TestHistoryTable({ scoreHistory }: Props) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'takenAt', desc: true }])
  const [filterMode, setFilterMode] = useState<FilterMode>('all')

  const filtered = scoreHistory.filter(r => {
    if (filterMode === 'all') return true
    if (filterMode === 'retake') return r.isRetake
    return r.testMode === filterMode
  })

  const columns = [
    helper.accessor('takenAt', {
      header: 'Date',
      cell: info => format(new Date(info.getValue()), 'MMM d, yyyy'),
      sortingFn: 'datetime',
    }),
    helper.accessor('examSetName', {
      header: 'Exam Set',
      enableSorting: false,
      cell: info => info.getValue() ?? <span className="text-muted-foreground italic text-xs">Random Practice</span>,
    }),
    helper.accessor('testMode', {
      header: 'Mode',
      enableSorting: false,
      cell: info => (
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', MODE_COLORS[info.getValue()] ?? '')}>
          {MODE_LABELS[info.getValue()] ?? info.getValue()}
        </span>
      ),
    }),
    helper.accessor('scaledScore', {
      header: 'Score',
      cell: info => (
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{info.getValue()}</span>
          {info.row.original.isRetake && (
            <Badge variant="outline" className="text-xs">Retake</Badge>
          )}
        </div>
      ),
    }),
    helper.accessor('totalScore', {
      header: '%',
      cell: info => (
        <div className="flex items-center gap-2">
          <Progress value={info.getValue()} className="w-16 h-2" />
          <span className="text-xs">{info.getValue()}%</span>
        </div>
      ),
    }),
    helper.display({
      id: 'sections',
      header: 'Sections',
      cell: info => (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {info.row.original.sectionScores.map(s => (
            <span key={s.section} className="text-xs text-muted-foreground whitespace-nowrap">
              {s.section}: <span className="font-medium text-foreground">{s.percentage}%</span>
            </span>
          ))}
        </div>
      ),
    }),
    helper.display({
      id: 'actions',
      header: '',
      cell: info => (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={e => { e.stopPropagation(); router.push(`/mock-test/${info.row.original.testId}/results`) }}
        >
          View
        </Button>
      ),
    }),
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const TABS: { key: FilterMode; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'full', label: 'Full Test' },
    { key: 'section', label: 'Section' },
    { key: 'drill', label: 'Drill' },
    { key: 'retake', label: 'Retakes' },
  ]

  if (scoreHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <p className="text-sm">No tests taken yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilterMode(tab.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
              filterMode === tab.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th
                      key={h.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground"
                    >
                      {h.isPlaceholder ? null : (
                        <button
                          className={cn('flex items-center gap-1', h.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : '')}
                          onClick={h.column.getToggleSortingHandler()}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && (
                            h.column.getIsSorted() === 'asc' ? <ChevronUp className="h-3 w-3" /> :
                            h.column.getIsSorted() === 'desc' ? <ChevronDown className="h-3 w-3" /> :
                            <ChevronsUpDown className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No tests match this filter.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => router.push(`/mock-test/${row.original.testId}/results`)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            {' '}· {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <Button size="icon" variant="outline" className="h-7 w-7"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="outline" className="h-7 w-7"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
