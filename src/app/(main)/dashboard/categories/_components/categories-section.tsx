"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
} from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { FlatCategory } from "./data";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function preventNav(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

interface CategoriesSectionProps {
  data: FlatCategory[];
  isLoading: boolean;
  onEdit: (row: FlatCategory) => void;
  onDelete: (row: FlatCategory) => void;
  deletingId: number | null;
}

export function CategoriesSection({ data, isLoading, onEdit, onDelete, deletingId }: CategoriesSectionProps) {
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns: ColumnDef<FlatCategory>[] = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <div className="text-sm tracking-tight">#{row.original.id}</div>,
      },
      {
        accessorKey: "name",
        header: "Category Name",
        cell: ({ row }) => (
          <div
            className="font-medium text-sm"
            style={{ paddingLeft: row.original.depth > 0 ? row.original.depth * 16 : 0 }}
          >
            {row.original.depth > 0 && <span className="mr-1 text-muted-foreground">↳</span>}
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: "parentName",
        header: "Parent",
        cell: ({ row }) => (
          <div className="text-sm">
            {row.original.parentName ?? <span className="text-muted-foreground">Top-level</span>}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-md truncate text-sm" title={row.original.description}>
            {row.original.description ?? <span className="text-muted-foreground italic">—</span>}
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => <div className="text-sm">{formatDate(row.original.createdAt)}</div>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const isDeleting = deletingId === row.original.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-muted-foreground hover:bg-transparent focus-visible:bg-transparent"
                onClick={() => onEdit(row.original)}
              >
                <Pencil />
                <span className="sr-only">Edit category</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full text-destructive/50 hover:bg-transparent hover:text-destructive focus-visible:bg-transparent"
                disabled={isDeleting}
                onClick={() => onDelete(row.original)}
              >
                {isDeleting ? (
                  <span className="size-3.5 animate-spin rounded-full border border-destructive border-t-transparent" />
                ) : (
                  <Trash2 />
                )}
                <span className="sr-only">Delete category</span>
              </Button>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deletingId, onEdit, onDelete],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, pagination },
    getRowId: (row) => String(row.id),
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  });

  const pageCount = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  let pageNumbers: number[];
  if (pageCount <= 3) pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
  else if (currentPage <= 2) pageNumbers = [1, 2, 3];
  else if (currentPage >= pageCount - 1) pageNumbers = [pageCount - 2, pageCount - 1, pageCount];
  else pageNumbers = [currentPage - 1, currentPage, currentPage + 1];

  return (
    <section>
      <Card>
        <CardHeader>
          <CardTitle className="leading-none">Categories</CardTitle>
          <CardDescription>All auction item categories and their hierarchy.</CardDescription>
          <CardAction>
            <Input
              className="h-7 w-44 md:w-52"
              placeholder="Search categories..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value || "");
                table.setPageIndex(0);
              }}
            />
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="overflow-hidden">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
              <TableHeader className="border-t **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground **:data-[slot='table-head']:text-sm">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot='table-row']:border-border/50 **:data-[slot='table-row']:hover:bg-transparent">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={columns.length} className="py-3">
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 pb-1">
            <p className="text-muted-foreground text-sm">{table.getFilteredRowModel().rows.length} categories</p>
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      preventNav(e);
                      table.previousPage();
                    }}
                  />
                </PaginationItem>
                {pageNumbers[0] > 1 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                {pageNumbers.map((n) => (
                  <PaginationItem key={n}>
                    <PaginationLink
                      href="#"
                      isActive={table.getState().pagination.pageIndex === n - 1}
                      onClick={(e) => {
                        preventNav(e);
                        table.setPageIndex(n - 1);
                      }}
                    >
                      {n}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {pageNumbers[pageNumbers.length - 1] < pageCount && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : undefined}
                    onClick={(e) => {
                      preventNav(e);
                      table.nextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
