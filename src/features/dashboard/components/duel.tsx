import { useH2h } from "@/features/dashboard/api/get-h2h"
import { DuelCard, DuelCardFooter } from "@/features/dashboard/components/duel-card"
import { DuelCenter } from "@/features/dashboard/components/duel-center"
import { DuelRadar } from "@/features/dashboard/components/duel-radar"
import {
  computeDuelAttributes,
  dominanceFromForm,
  dominanceFromH2h,
  duelTally,
  duelTrait,
  heroStat,
  superlatives,
} from "@/features/dashboard/lib/duel-attributes"

import type { DuelReceipt } from "@/features/dashboard/components/duel-center"
import type { PlayerData } from "@/features/dashboard/lib/duel-attributes"
import type { PlayerSummary } from "@/lib/schemas/player"

// The duel (§5.1 redesign): the whole three-column contest. Cards flank a
// centre engine — score, dominance, attribute rows, verdict, receipts. In
// head-to-head mode the score is their real record and every number is
// scoped to shared games; in all-games mode the score is the stat duel
// itself and the numbers are overall form. On phones the cards face off
// two-up and the engine follows below.

function receiptValue(n: number | undefined): string {
  return n === undefined ? "—" : String(n)
}

function buildReceipts(d1: PlayerData, d2: PlayerData): Array<DuelReceipt> {
  return [
    {
      label: "Games won",
      v1: receiptValue(d1.headline?.games_won),
      v2: receiptValue(d2.headline?.games_won),
    },
    {
      label: "Aces",
      v1: receiptValue(d1.serve?.aces),
      v2: receiptValue(d2.serve?.aces),
    },
    {
      label: "Double faults",
      v1: receiptValue(d1.serve?.double_faults),
      v2: receiptValue(d2.serve?.double_faults),
    },
    {
      label: "Comebacks",
      v1: receiptValue(d1.momentum?.comebacks),
      v2: receiptValue(d2.momentum?.comebacks),
    },
    {
      label: "Longest rally",
      v1: receiptValue(d1.rally?.longest),
      v2: receiptValue(d2.rally?.longest),
    },
    {
      label: "Tins",
      v1: receiptValue(d1.error?.tin),
      v2: receiptValue(d2.error?.tin),
    },
  ]
}

export function Duel({
  player1,
  player2,
  d1,
  d2,
  mode,
}: {
  player1: PlayerSummary
  player2: PlayerSummary
  d1: PlayerData
  d2: PlayerData
  mode: "all" | "h2h"
}) {
  const h2h = useH2h(player1.id, player2.id)

  const attrs1 = computeDuelAttributes(d1)
  const attrs2 = computeDuelAttributes(d2)
  const tally = duelTally(attrs1, attrs2)
  const pills = superlatives(d1, d2, attrs1, attrs2)

  const score =
    mode === "h2h"
      ? {
          p1: h2h.data?.matches_won_p1 ?? 0,
          p2: h2h.data?.matches_won_p2 ?? 0,
          heading: "Full time",
          caption: "Matches won",
        }
      : { ...tally, heading: "The duel", caption: "Stats won" }
  const dominance =
    mode === "h2h"
      ? h2h.data
        ? dominanceFromH2h(h2h.data)
        : null
      : dominanceFromForm(d1.headline, d2.headline)

  // desktop is the three-column duel — cards flank the engine; on phones the
  // cards stack full-width (richer, more legible than a cramped two-up) with
  // the engine below
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[16rem_minmax(0,1fr)_16rem] md:gap-x-8">
      <div className="flex flex-col gap-3 md:col-start-1 md:row-start-1">
        <DuelCard
          name={player1.name}
          side="p1"
          avatarSrc="/avatars/player-1.svg"
          trait={duelTrait(d1)}
          handedness={player1.handedness}
          hero={heroStat(d1)}
          attrs={attrs1}
        />
        <DuelRadar attrs={attrs1} side="p1" name={player1.name} />
        <DuelCardFooter
          name={player1.name}
          trait={duelTrait(d1)}
          pills={pills.p1}
        />
      </div>

      <div className="flex flex-col gap-3 md:col-start-3 md:row-start-1">
        <DuelCard
          name={player2.name}
          side="p2"
          avatarSrc="/avatars/player-2.svg"
          trait={duelTrait(d2)}
          handedness={player2.handedness}
          hero={heroStat(d2)}
          attrs={attrs2}
        />
        <DuelRadar attrs={attrs2} side="p2" name={player2.name} />
        <DuelCardFooter
          name={player2.name}
          trait={duelTrait(d2)}
          pills={pills.p2}
        />
      </div>

      <div className="md:col-start-2 md:row-start-1 md:pt-1">
        <DuelCenter
          name1={player1.name}
          name2={player2.name}
          score={score}
          dominance={dominance}
          attrs1={attrs1}
          attrs2={attrs2}
          tally={tally}
          receipts={buildReceipts(d1, d2)}
        />
      </div>
    </div>
  )
}
