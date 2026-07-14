// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DataTable } from "./data-table"

import type { ManageColumn } from "./data-table"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

interface Row {
  id: string
  name: string
}

const columns: Array<ManageColumn<Row>> = [
  { key: "id", label: "id", render: (r) => r.id },
  { key: "name", label: "name", sortable: true, render: (r) => r.name },
]

const base = {
  columns,
  pageNumber: 1,
  sort: { column: "name", dir: "asc" as const },
  onSort: () => undefined,
  onPage: () => undefined,
  onRetry: () => undefined,
  rowKey: (r: Row) => r.id,
  isPending: false,
  isError: false,
}

describe("DataTable (§5.4 states)", () => {
  it("skeleton rows while the first page loads", () => {
    const { container } = render(
      <DataTable {...base} result={undefined} isPending />
    )
    expect(
      container.querySelectorAll('[data-slot="skeleton"]').length
    ).toBeGreaterThan(0)
  })

  it("failed fetch → inline retry card", () => {
    const onRetry = vi.fn()
    render(<DataTable {...base} result={undefined} isError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it("renders rows, sortable headers, and pager maths", () => {
    const onSort = vi.fn()
    render(
      <DataTable
        {...base}
        onSort={onSort}
        result={{ rows: [{ id: "a", name: "Sam" }], total: 51 }}
      />
    )
    expect(screen.getByText("Sam")).toBeDefined()
    expect(screen.getByText("1–25 of 51")).toBeDefined()
    expect(
      screen.getByRole("button", { name: "Prev" }).hasAttribute("disabled")
    ).toBe(true)
    expect(
      screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")
    ).toBe(false)

    fireEvent.click(screen.getByRole("button", { name: /name/ }))
    expect(onSort).toHaveBeenCalledWith("name")
  })

  it("empty result → explicit no-records row", () => {
    render(<DataTable {...base} result={{ rows: [], total: 0 }} />)
    expect(screen.getByText("No records match.")).toBeDefined()
    expect(screen.getByText("0 of 0")).toBeDefined()
  })
})
