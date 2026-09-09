import { describe, expect, it } from "vitest"

import { friendlyWriteError } from "./friendly-errors"

// The shapes here are the ones supabase-js actually produces — verified
// against @supabase/postgrest-js by driving a real client with an injected
// fetch. It does NOT rethrow the fetch TypeError and does NOT put `status`
// on the error: a dropped connection arrives as a plain object whose
// `message` is the raw "TypeError: Failed to fetch" and whose `code` is "".
// Handing that string to the user is what this guards against.

/** exactly what postgrest-js resolves a dropped connection into */
const OFFLINE = {
  message: "TypeError: Failed to fetch",
  details: "TypeError: Failed to fetch\n    at offlineFetch (...)",
  hint: "",
  code: "",
}

describe("friendlyWriteError", () => {
  it("never shows the raw driver message when the connection drops", () => {
    expect(friendlyWriteError(OFFLINE)).toBe(
      "The save failed — check your connection and try again."
    )
  })

  it("uses the caller's fallback for a transport failure", () => {
    expect(friendlyWriteError(OFFLINE, "Couldn't save the match.")).toBe(
      "Couldn't save the match."
    )
  })

  it("swallows a 5xx gateway HTML body rather than rendering it", () => {
    const gateway = { message: "<html><body>502 Bad Gateway</body></html>" }
    expect(friendlyWriteError(gateway)).not.toContain("<html>")
    expect(friendlyWriteError(gateway)).toBe(
      "The save failed — check your connection and try again."
    )
  })

  it("still passes a trigger's own sentence through", () => {
    // raise_exception from rallies_validate_players — already a sentence
    const trigger = {
      code: "P0001",
      message: "server_id 42 is not a player in this match",
    }
    expect(friendlyWriteError(trigger)).toBe(
      "server_id 42 is not a player in this match"
    )
  })

  it("still translates constraint names and RLS denials", () => {
    expect(
      friendlyWriteError({
        code: "23514",
        message: 'violates check constraint "matches_distinct_players"',
      })
    ).toBe("A match needs two different players.")

    expect(
      friendlyWriteError({ code: "42501", message: "permission denied" })
    ).toBe("You don't have permission to change this — sign in as the owner.")
  })

  it("falls back rather than throwing on a null error", () => {
    expect(friendlyWriteError(null)).toBe(
      "The save failed — check your connection and try again."
    )
  })
})
