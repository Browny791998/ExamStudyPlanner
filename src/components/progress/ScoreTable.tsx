"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface ScoreRow {
  testId: string;
  title: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  date: string;
}

const columnHelper = createColumnHelper<ScoreRow>();

const columns = [
  columnHelper.accessor("title", { header: "Test" }),
  columnHelper.accessor("score", {
    header: "Score %",
    cell: (info) => (
      <Badge variant={info.getValue() >= 70 ? "default" : "destructive"}>
        {info.getValue().toFixed(1)}%
      </Badge>
    ),
  }),
  columnHelper.accessor("correctAnswers", {
    header: "Correct",
    cell: (info) =>
      `${info.getValue()} / ${info.row.original.totalQuestions}`,
  }),
  columnHelper.accessor("timeTaken", {
    header: "Time",
    cell: (info) => `${Math.floor(info.getValue() / 60)}m ${info.getValue() % 60}s`,
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => format(new Date(info.getValue()), "MMM d, yyyy"),
  }),
];

interface ScoreTableProps {
  data: ScoreRow[];
}

const PAGE_SIZE = 10;

export function ScoreTable({ data }: ScoreTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc"
                    ? " ↑"
                    : header.column.getIsSorted() === "desc"
                    ? " ↓"
                    : ""}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            {" "}· {data.length} result{data.length !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
