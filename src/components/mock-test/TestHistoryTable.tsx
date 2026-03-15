'use client'

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useDeleteTest } from '@/hooks/useMockTest'
import type { IMockTest, IMockResult } from '@/types/mockTest'

type TestRow = IMockTest & { result?: IMockResult }

function ModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    full: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30',
    section: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30',
    drill: 'bg-green-100 text-green-700 dark:bg-green-900/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize', colors[mode] ?? 'bg-muted text-muted-foreground')}>
      {mode}
    </span>
  )
}

function PercentageBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground">{Math.round(value)}%</span>
    </div>
  )
}

function WeakAreaBadges({ areas }: { areas: string[] }) {
  if (!areas.length) return <span className="text-xs text-muted-foreground">—</span>
  const shown = areas.slice(0, 2)
  const extra = areas.length - 2
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(a => (
        <span key={a} className="rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs">{a}</span>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra} more</span>}
    </div>
  )
}

interface TestHistoryTableProps {
  tests: TestRow[]
}

export function TestHistoryTable({ tests }: TestHistoryTableProps) {
  const router = useRouter()
  const { deleteTest, isPending: isDeleting } = useDeleteTest()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [modeFilter, setModeFilter] = useState<string>('all')

  const filtered = useMemo(
    () => modeFilter === 'all' ? tests : tests.filter(t => t.testMode === modeFilter),
    [tests, modeFilter]
  )

  const columns: ColumnDef<TestRow>[] = useMemo(() => [
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(getValue() as string), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      accessorKey: 'examType',
      header: 'Plan',
      cell: ({ getValue }) => <Badge variant="outline" className="text-xs">{getValue() as string}</Badge>,
    },
    {
      accessorKey: 'testMode',
      header: 'Mode',
      cell: ({ getValue }) => <ModeBadge mode={getValue() as string} />,
    },
    {
      id: 'scaledScore',
      header: 'Score',
      accessorFn: row => row.result?.scaledScore ?? '—',
      cell: ({ getValue }) => (
        <span className="text-lg font-bold">{getValue() as string}</span>
      ),
    },
    {
      id: 'percentage',
      header: '%',
      accessorFn: row => row.result?.totalScore ?? 0,
      cell: ({ getValue }) => <PercentageBar value={getValue() as number} />,
    },
    {
      id: 'weakAreas',
      header: 'Weak Areas',
      accessorFn: row => row.result?.weakAreas ?? [],
      cell: ({ getValue }) => <WeakAreaBadges areas={getValue() as string[]} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const testId = row.original._id as string
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => router.push(`/mock-test/${testId}/results`)}
            >
              View
            </Button>
            {confirmId === testId ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={isDeleting && deletingId === testId}
                  onClick={() => {
                    setDeletingId(testId)
                    deleteTest(testId, { onSettled: () => { setDeletingId(null); setConfirmId(null) } })
                  }}
                >
                  {isDeleting && deletingId === testId ? 'Deleting…' : 'Confirm'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmId(null)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setConfirmId(testId)}
              >
                Delete
              </Button>
            )}
          </div>
        )
      },
    },
  ], [router, confirmId, isDeleting, deletingId, deleteTest])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {['all', 'full', 'section', 'drill'].map(mode => (
          <button
            key={mode}
            onClick={() => { setModeFilter(mode); table.setPageIndex(0) }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize',
              modeFilter === mode
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Table */}
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
                    {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  No tests taken yet — start your first mock test above!
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/30 transition-colors">
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

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filtered.length} results</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <span className="flex items-center px-2">Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
            <Button size="sm" variant="outline" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
