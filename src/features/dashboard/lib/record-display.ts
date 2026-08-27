import type { RecordKey, RecordRow } from "@/features/dashboard/schemas/records"

// Presentation for the records wall: each RPC row becomes the strings one
// tile renders — the shouted value, the label, and the caption (holder or
// pairing, then provenance). Pure and testable; the tile itself just lays
// the strings out.

export interface RecordTileDisplay {
  key: RecordKey
  title: string
  /** The big figure: "23", "3–0", "6". */
  value: string
  /** Small word beside the value, already pluralised: "shots", "wins". */
  unit: string | null
  /** Who the caption leads with — the holder, or the match pairing for a
   *  match-owned record. `isHolder` says whether it wears a side colour. */
  lead: string
  isHolder: boolean
  /** The rest of the caption after the lead: score detail and date. */
  rest: string
  /** The holder's side IN THE RECORD'S MATCH — the colour law's anchor, so
   *  the tile agrees with the match page it links to. Null for match-owned
   *  records, which wear a neutral bar. */
  tone: "p1" | "p2" | null
  matchId: string
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return n === 1 ? singular : pluralForm
}

interface RecordMeta {
  title: string
  /** The big figure; defaults to the row's numeric value. */
  value?: (r: RecordRow) => string
  unit?: (r: RecordRow) => string
  /** Extra caption fragment between the lead and the date. */
  detail?: (r: RecordRow) => string | null
}

const META: Record<RecordKey, RecordMeta> = {
  biggest_win: {
    title: "Biggest win",
    value: (r) => r.detail ?? String(r.value),
  },
  longest_rally: {
    title: "Longest rally",
    unit: (r) => plural(r.value, "shot"),
  },
  best_streak: { title: "Best streak", unit: (r) => plural(r.value, "win") },
  marathon_game: {
    title: "Marathon game",
    unit: (r) => plural(r.value, "rally", "rallies"),
    detail: (r) => r.detail,
  },
  most_aces: { title: "Most aces in a match" },
  most_lets: { title: "Most lets in a match" },
}

/** The wall's stable order — the schema enum's order, headline records first. */
const ORDER: Array<RecordKey> = [
  "biggest_win",
  "longest_rally",
  "best_streak",
  "marathon_game",
  "most_aces",
  "most_lets",
]

export function buildRecordTiles(
  rows: Array<RecordRow>,
  nameOf: (id: string) => string
): Array<RecordTileDisplay> {
  return ORDER.flatMap((key) => {
    const row = rows.find((r) => r.record_key === key)
    if (!row) return []
    const meta = META[key]
    const detail = meta.detail?.(row) ?? null
    return [
      {
        key,
        title: meta.title,
        value: meta.value?.(row) ?? String(row.value),
        unit: meta.unit?.(row) ?? null,
        lead:
          row.player_id === null
            ? `${nameOf(row.player1_id)} v ${nameOf(row.player2_id)}`
            : nameOf(row.player_id),
        isHolder: row.player_id !== null,
        rest: [detail, formatDate(row.date)].filter(Boolean).join(" · "),
        tone:
          row.player_id === row.player1_id
            ? ("p1" as const)
            : row.player_id === row.player2_id
              ? ("p2" as const)
              : null,
        matchId: row.match_id,
      },
    ]
  })
}
