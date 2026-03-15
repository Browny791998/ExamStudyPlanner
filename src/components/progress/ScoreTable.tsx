"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
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
import { Badge } from "@/components/ui/badge";
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

export function ScoreTable({ data }: ScoreTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
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
  );
}
