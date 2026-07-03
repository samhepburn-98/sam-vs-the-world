// The five insight categories (§3.3). Shared by the player overview cards
// (#27) and the category detail template (#28), so the set — and the URL
// path segment for each — is defined once.

export const CATEGORIES = [
  { key: "head-to-head", label: "Head-to-head", blurb: "Results & form" },
  { key: "serve", label: "Serve", blurb: "Serving & returning" },
  { key: "errors", label: "Errors", blurb: "Where points are given away" },
  { key: "rallies", label: "Rallies", blurb: "Length & shot patterns" },
  { key: "momentum", label: "Momentum", blurb: "Comebacks & streaks" },
] as const

export type CategoryKey = (typeof CATEGORIES)[number]["key"]

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key)

export function categoryLabel(key: CategoryKey): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key
}
