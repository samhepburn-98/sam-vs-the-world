import { useH2h } from "@/features/dashboard/api/get-h2h"
import { AttributeRadar } from "@/features/dashboard/components/attribute-radar"
import { PlayerCardFooter } from "@/features/dashboard/components/player-card-footer"
import { DuelCenter } from "@/features/dashboard/components/duel-center"
import { PlayerCard } from "@/features/dashboard/components/player-card"
import {
  dominanceFromForm,
  dominanceFromH2h,
  duelTally,
  superlatives,
} from "@/features/dashboard/lib/duel-scoring"
import {
  computePlayerAttributes,
  heroStat,
  playerTrait,
} from "@/features/dashboard/lib/player-attributes"

import type { DuelReceipt } from "@/features/dashboard/components/duel-center"
import type { PlayerData } from "@/features/dashboard/lib/player-attributes"
import type { PlayerSummary } from "@/lib/schemas/player"

// The duel: the whole three-column contest. Cards flank a
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

  const attrs1 = computePlayerAttributes(d1)
  const attrs2 = computePlayerAttributes(d2)
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

  // desktop is the three-column duel — cards flank the engine, all three
  // middle-aligned; on phones the cards face off two-up with
  // the engine full-width below
  return (
    <div className="grid grid-cols-2 items-center gap-x-2.5 gap-y-6 sm:gap-x-8 md:grid-cols-[16rem_minmax(0,1fr)_16rem] md:gap-x-12">
      <div className="flex flex-col gap-3 md:col-start-1 md:row-start-1 md:gap-14">
        <PlayerCard
          name={player1.name}
          side="p1"
          avatarSrc={player1.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(d1)}
          handedness={player1.handedness}
          hero={heroStat(d1)}
          attrs={attrs1}
        />
        <div className="flex flex-col gap-3">
          <div className="mx-auto w-full max-w-36 md:max-w-none">
            <AttributeRadar attrs={attrs1} side="p1" name={player1.name} />
          </div>
          <PlayerCardFooter
            name={player1.name}
            trait={playerTrait(d1)}
            pills={pills.p1}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:col-start-3 md:row-start-1 md:gap-14">
        <PlayerCard
          name={player2.name}
          side="p2"
          avatarSrc={player2.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(d2)}
          handedness={player2.handedness}
          hero={heroStat(d2)}
          attrs={attrs2}
        />
        <div className="flex flex-col gap-3">
          <div className="mx-auto w-full max-w-36 md:max-w-none">
            <AttributeRadar attrs={attrs2} side="p2" name={player2.name} />
          </div>
          <PlayerCardFooter
            name={player2.name}
            trait={playerTrait(d2)}
            pills={pills.p2}
            side="p2"
          />
        </div>
      </div>

      <div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-1">
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
