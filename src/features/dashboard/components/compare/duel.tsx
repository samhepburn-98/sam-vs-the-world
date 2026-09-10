import { useH2h } from "@/features/dashboard/api/get-h2h"
import { AttributeRadar } from "@/features/dashboard/components/shared/attribute-radar"
import { PlayerCardFooter } from "@/features/dashboard/components/compare/player-card-footer"
import { DuelCenter } from "@/features/dashboard/components/compare/duel-center"
import { PlayerCard } from "@/features/dashboard/components/shared/player-card"
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

import type { DuelReceipt } from "@/features/dashboard/components/compare/duel-center"
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

function buildReceipts(
  p1Data: PlayerData,
  p2Data: PlayerData
): Array<DuelReceipt> {
  return [
    {
      label: "Games won",
      p1Value: receiptValue(p1Data.headline?.games_won),
      p2Value: receiptValue(p2Data.headline?.games_won),
    },
    {
      label: "Aces",
      p1Value: receiptValue(p1Data.serve?.aces),
      p2Value: receiptValue(p2Data.serve?.aces),
    },
    {
      label: "Double faults",
      p1Value: receiptValue(p1Data.serve?.double_faults),
      p2Value: receiptValue(p2Data.serve?.double_faults),
    },
    {
      label: "Comebacks",
      p1Value: receiptValue(p1Data.momentum?.comebacks),
      p2Value: receiptValue(p2Data.momentum?.comebacks),
    },
    {
      label: "Longest rally",
      p1Value: receiptValue(p1Data.rally?.longest),
      p2Value: receiptValue(p2Data.rally?.longest),
    },
    {
      label: "Tins",
      p1Value: receiptValue(p1Data.error?.tin),
      p2Value: receiptValue(p2Data.error?.tin),
    },
  ]
}

export function Duel({
  p1,
  p2,
  p1Data,
  p2Data,
  mode,
}: {
  p1: PlayerSummary
  p2: PlayerSummary
  p1Data: PlayerData
  p2Data: PlayerData
  mode: "all" | "h2h"
}) {
  const h2h = useH2h({ player1Id: p1.id, player2Id: p2.id })

  const p1Attrs = computePlayerAttributes(p1Data)
  const p2Attrs = computePlayerAttributes(p2Data)
  const tally = duelTally(p1Attrs, p2Attrs)
  const pills = superlatives(p1Data, p2Data, p1Attrs, p2Attrs)

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
      : dominanceFromForm(p1Data.headline, p2Data.headline)

  // desktop is the three-column duel — cards flank the engine, all three
  // middle-aligned; on phones the cards face off two-up with
  // the engine full-width below
  return (
    <div className="grid grid-cols-2 items-center gap-x-2.5 gap-y-6 sm:gap-x-8 md:grid-cols-[16rem_minmax(0,1fr)_16rem] md:gap-x-12">
      <div className="flex flex-col gap-3 md:col-start-1 md:row-start-1 md:gap-14">
        <PlayerCard
          name={p1.name}
          side="p1"
          avatarSrc={p1.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(p1Data)}
          handedness={p1.handedness}
          hero={heroStat(p1Data)}
          attrs={p1Attrs}
        />
        <div className="flex flex-col gap-3">
          <div className="mx-auto w-full max-w-36 md:max-w-none">
            <AttributeRadar attrs={p1Attrs} side="p1" name={p1.name} />
          </div>
          <PlayerCardFooter
            name={p1.name}
            trait={playerTrait(p1Data)}
            pills={pills.p1}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 md:col-start-3 md:row-start-1 md:gap-14">
        <PlayerCard
          name={p2.name}
          side="p2"
          avatarSrc={p2.avatar_url ?? "/avatars/default.svg"}
          trait={playerTrait(p2Data)}
          handedness={p2.handedness}
          hero={heroStat(p2Data)}
          attrs={p2Attrs}
        />
        <div className="flex flex-col gap-3">
          <div className="mx-auto w-full max-w-36 md:max-w-none">
            <AttributeRadar attrs={p2Attrs} side="p2" name={p2.name} />
          </div>
          <PlayerCardFooter
            name={p2.name}
            trait={playerTrait(p2Data)}
            pills={pills.p2}
            side="p2"
          />
        </div>
      </div>

      <div className="col-span-2 md:col-span-1 md:col-start-2 md:row-start-1">
        <DuelCenter
          p1Name={p1.name}
          p2Name={p2.name}
          score={score}
          dominance={dominance}
          p1Attrs={p1Attrs}
          p2Attrs={p2Attrs}
          tally={tally}
          receipts={buildReceipts(p1Data, p2Data)}
        />
      </div>
    </div>
  )
}
