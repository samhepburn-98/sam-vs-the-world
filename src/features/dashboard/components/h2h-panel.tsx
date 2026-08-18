import { useH2h } from "@/features/dashboard/api/get-h2h"
import { SectionTitle } from "@/components/typography"
import { Skeleton } from "@/components/ui/skeleton"

// The head-to-head panel on compare (§5.1): shown only when exactly two
// players are selected. If they've met, their record and the match history;
// if not, an honest note. Lives in its own component so the h2h hook only
// runs when there are two players to compare.

export function H2hPanel({
  player1Id,
  player2Id,
  name1,
  name2,
}: {
  player1Id: string
  player2Id: string
  name1: string
  name2: string
}) {
  const h2h = useH2h(player1Id, player2Id)
  if (!h2h.data) return <Skeleton className="h-32 w-full rounded-2xl" />

  const h = h2h.data
  const played = h.games_decided > 0 || h.match_history.length > 0

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
      <SectionTitle>
        {name1} vs {name2}
      </SectionTitle>

      {!played ? (
        <p className="text-sm text-muted-foreground">
          They haven&rsquo;t played each other yet.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="tabular-nums">
              Games {h.games_won_p1}–{h.games_won_p2}
            </span>
            <span className="tabular-nums">
              Matches {h.matches_won_p1}–{h.matches_won_p2}
            </span>
          </div>
          {h.match_history.length > 0 && (
            <ul className="flex flex-col divide-y">
              {h.match_history.map((m) => (
                <li
                  key={m.match_id}
                  className="flex items-center justify-between gap-3 py-1.5 text-sm"
                >
                  <span className="text-muted-foreground tabular-nums">
                    {m.date}
                  </span>
                  <span className="tabular-nums">
                    {m.games_won_p1}–{m.games_won_p2}
                  </span>
                  {/* the verdict comes from the backend's outcome column —
                      a draw and a match still in play are different things */}
                  <span
                    className={
                      m.outcome === "p1" || m.outcome === "p2"
                        ? "font-semibold"
                        : "text-muted-foreground"
                    }
                  >
                    {m.outcome === "p1"
                      ? name1
                      : m.outcome === "p2"
                        ? name2
                        : m.outcome === "draw"
                          ? "Drawn"
                          : "In play"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
