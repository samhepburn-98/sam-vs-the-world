// @vitest-environment jsdom
import { describe, expect, it } from "vitest"

import { hotkeyAction, isEditableTarget } from "./hotkeys"

const key = (pressed: string, mods: Partial<KeyboardEvent> = {}) => ({
  key: pressed,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  ...mods,
})

describe("hotkeyAction — the §5.3 map, exactly", () => {
  it("s/d pick the winner by screen side", () => {
    expect(hotkeyAction(key("s"))).toEqual({ type: "winner", side: "p1" })
    expect(hotkeyAction(key("d"))).toEqual({ type: "winner", side: "p2" })
  })

  it("l = let, w/e/k/a/f = end reasons", () => {
    expect(hotkeyAction(key("l"))).toEqual({ type: "let" })
    expect(hotkeyAction(key("w"))).toEqual({ type: "endReason", reason: "winner" })
    expect(hotkeyAction(key("e"))).toEqual({ type: "endReason", reason: "error" })
    expect(hotkeyAction(key("k"))).toEqual({ type: "endReason", reason: "stroke" })
    expect(hotkeyAction(key("f"))).toEqual({
      type: "endReason",
      reason: "serve_fault",
    })
  })

  it("t/o/i/b/n = error details (x/double-bounce retired)", () => {
    expect(hotkeyAction(key("t"))).toEqual({ type: "errorDetail", detail: "tin" })
    expect(hotkeyAction(key("o"))).toEqual({ type: "errorDetail", detail: "out_top" })
    expect(hotkeyAction(key("i"))).toEqual({ type: "errorDetail", detail: "out_side" })
    expect(hotkeyAction(key("b"))).toEqual({ type: "errorDetail", detail: "out_back" })
    expect(hotkeyAction(key("n"))).toEqual({ type: "errorDetail", detail: "not_up" })
    expect(hotkeyAction(key("x"))).toBeNull()
  })

  it("g forced · q serve number · z serve box · digits · enter · u/cmd+z · ?", () => {
    expect(hotkeyAction(key("g"))).toEqual({ type: "toggleForced" })
    expect(hotkeyAction(key("q"))).toEqual({ type: "toggleServeNumber" })
    expect(hotkeyAction(key("z"))).toEqual({ type: "toggleServeSide" })
    expect(hotkeyAction(key("7"))).toEqual({ type: "digit", digit: 7 })
    expect(hotkeyAction(key("Enter"))).toEqual({ type: "save" })
    expect(hotkeyAction(key("u"))).toEqual({ type: "undo" })
    expect(hotkeyAction(key("z", { metaKey: true }))).toEqual({ type: "undo" })
    expect(hotkeyAction(key("z", { ctrlKey: true }))).toEqual({ type: "undo" })
    expect(hotkeyAction(key("?"))).toEqual({ type: "help" })
  })

  it("modified keys and unmapped keys stay the browser's", () => {
    expect(hotkeyAction(key("s", { metaKey: true }))).toBeNull() // cmd+s
    expect(hotkeyAction(key("r", { ctrlKey: true }))).toBeNull()
    expect(hotkeyAction(key("s", { altKey: true }))).toBeNull()
    expect(hotkeyAction(key("p"))).toBeNull()
    expect(hotkeyAction(key("Escape"))).toBeNull()
  })
})

describe("isEditableTarget", () => {
  it("inputs, textareas, selects are editable; buttons and body are not", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true)
    expect(isEditableTarget(document.createElement("textarea"))).toBe(true)
    expect(isEditableTarget(document.createElement("select"))).toBe(true)
    expect(isEditableTarget(document.createElement("button"))).toBe(false)
    expect(isEditableTarget(document.body)).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
