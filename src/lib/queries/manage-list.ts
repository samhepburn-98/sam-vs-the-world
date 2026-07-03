// Shared plumbing for the /manage raw browser's paginated lists (§5.4).
// Each tab has its own hook file (§8.4); this holds the common types and
// the search-classifier they all use.

export const MANAGE_PAGE_SIZE = 25

export interface SortSpec {
  column: string
  dir: "asc" | "desc"
}

export interface ListParams {
  page: number
  sort: SortSpec
  /** free text — each tab interprets it (uuid → id filters, else per-tab) */
  q: string
}

export interface ListPage<T> {
  rows: Array<T>
  total: number
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type QueryKind =
  | { kind: "empty" }
  | { kind: "uuid"; value: string }
  | { kind: "number"; value: number }
  | { kind: "text"; value: string }

/** How a search box value should filter: a pasted id, a number, or text.
 *  Text is stripped of PostgREST or()-syntax characters — they can't appear
 *  in any value we search and would break the filter string. */
export function classifyQuery(raw: string): QueryKind {
  const q = raw.trim()
  if (q === "") return { kind: "empty" }
  if (UUID_RE.test(q)) return { kind: "uuid", value: q.toLowerCase() }
  if (/^\d+$/.test(q)) return { kind: "number", value: Number(q) }
  return { kind: "text", value: q.replace(/[,%()]/g, "") }
}

/** Sort columns are whitelisted per tab — anything else falls back. */
export function sanitizeSort(
  sort: SortSpec,
  allowed: ReadonlySet<string>,
  fallback: string,
): SortSpec {
  return allowed.has(sort.column) ? sort : { column: fallback, dir: "desc" }
}
