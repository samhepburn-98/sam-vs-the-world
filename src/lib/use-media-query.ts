import { useSyncExternalStore } from "react"

// A tiny CSS-media-query subscription. The subscribe/getSnapshot callbacks run
// client-only (the server uses getServerSnapshot → `serverDefault`), so no SSR
// guard is needed here. `matchMedia` is cast to optional because jsdom (tests)
// omits it — there we fall back to `serverDefault`. In a real browser it tracks
// the live match and re-renders on change (e.g. a resize across a breakpoint).

export function useMediaQuery(query: string, serverDefault = false): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mm = window.matchMedia as typeof window.matchMedia | undefined
      if (!mm) return () => {}
      const mql = mm(query)
      mql.addEventListener("change", onChange)
      return () => {
        mql.removeEventListener("change", onChange)
      }
    },
    () => {
      const mm = window.matchMedia as typeof window.matchMedia | undefined
      return mm ? mm(query).matches : serverDefault
    },
    () => serverDefault,
  )
}
