import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MANAGE_PAGE_SIZE } from "@/lib/queries/manage-list"
import { cn } from "@/lib/utils"

import type { ListPage, SortSpec } from "@/lib/queries/manage-list"

// The manage browser's table shell (§5.4): dense rows, sortable headers,
// skeleton rows while loading, inline retry card on a failed fetch, and a
// compact pager. Column defs live with each tab; this renders whatever
// it's given.

export interface ManageColumn<T> {
  key: string
  label: string
  sortable?: boolean
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Array<ManageColumn<T>>
  result: ListPage<T> | undefined
  isPending: boolean
  isError: boolean
  onRetry: () => void
  pageNumber: number
  sort: SortSpec
  onSort: (column: string) => void
  onPage: (page: number) => void
  rowKey: (row: T) => string
}

export function DataTable<T>({
  columns,
  result,
  isPending,
  isError,
  onRetry,
  pageNumber,
  sort,
  onSort,
  onPage,
  rowKey,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <div className="rounded-lg border py-12 text-center">
        <p className="text-destructive text-sm">
          Couldn't load this table — check your connection.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={onRetry}
        >
          Retry
        </Button>
      </div>
    )
  }

  const total = result?.total ?? 0
  const start = (pageNumber - 1) * MANAGE_PAGE_SIZE
  const end = Math.min(start + MANAGE_PAGE_SIZE, total)

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "rounded-lg border",
          // keepPreviousData refresh: dim the stale page while the next loads
          isPending && result && "opacity-60 transition-opacity",
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      type="button"
                      className="hover:text-foreground group inline-flex cursor-pointer items-center gap-1"
                      onClick={() => onSort(col.key)}
                    >
                      {col.label}
                      {sort.column === col.key ? (
                        sort.dir === "asc" ? (
                          <ArrowUpIcon className="size-3" aria-hidden />
                        ) : (
                          <ArrowDownIcon className="size-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDownIcon
                          className="size-3 opacity-0 transition-opacity group-hover:opacity-40"
                          aria-hidden
                        />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result === undefined ? (
              Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : result.rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground py-8 text-center"
                >
                  No records match.
                </TableCell>
              </TableRow>
            ) : (
              result.rows.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className="whitespace-nowrap">
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span className="tabular-nums">
          {total === 0 ? "0" : `${start + 1}–${end}`} of {total}
        </span>
        <span className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageNumber <= 1}
            onClick={() => onPage(pageNumber - 1)}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={end >= total}
            onClick={() => onPage(pageNumber + 1)}
          >
            Next
          </Button>
        </span>
      </div>
    </div>
  )
}
