// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { useRowActions } from "./use-row-actions"

// RTL auto-cleanup needs vitest globals, which we don't enable — clean manually.
afterEach(cleanup)

interface Row {
  id: string
}
const a: Row = { id: "a" }
const b: Row = { id: "b" }

describe("useRowActions", () => {
  it("opens with nothing selected", () => {
    const { result } = renderHook(() => useRowActions<Row>())
    expect(result.current.editing).toBeNull()
    expect(result.current.deleting).toBeNull()
  })

  it("holds the row itself, not a flag — the dialogs need its fields", () => {
    const { result } = renderHook(() => useRowActions<Row>())
    act(() => result.current.edit(a))
    expect(result.current.editing).toBe(a)
    act(() => result.current.remove(b))
    expect(result.current.deleting).toBe(b)
  })

  it("keeps edit and delete independent", () => {
    const { result } = renderHook(() => useRowActions<Row>())
    act(() => result.current.edit(a))
    act(() => result.current.remove(b))
    act(() => result.current.doneEditing())
    // closing the editor must not dismiss a pending delete confirmation
    expect(result.current.editing).toBeNull()
    expect(result.current.deleting).toBe(b)
  })

  it("clears each slot on its own done", () => {
    const { result } = renderHook(() => useRowActions<Row>())
    act(() => result.current.remove(a))
    act(() => result.current.doneDeleting())
    expect(result.current.deleting).toBeNull()
  })

  it("replaces the selection when another row is picked", () => {
    const { result } = renderHook(() => useRowActions<Row>())
    act(() => result.current.edit(a))
    act(() => result.current.edit(b))
    expect(result.current.editing).toBe(b)
  })
})
