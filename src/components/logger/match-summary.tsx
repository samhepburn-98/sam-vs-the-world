import { Link } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// The finish-match summary (§5.3): every number here is derived from the
// logged rallies — finishing a match writes nothing (§7.4, finished-as-logged).

export interface GameSummaryLine {
  gameNumber: number
  scoreline: string
  winnerName: string | null
}

interface MatchSummaryProps {
  matchId: string
  headline: string
  subline: string
  games: Array<GameSummaryLine>
  onDone: () => void
}

export function MatchSummary({
  matchId,
  headline,
  subline,
  games,
  onDone,
}: MatchSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{headline}</CardTitle>
        <p className="text-muted-foreground text-sm">{subline}</p>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-1.5">
          {games.map((g) => (
            <li
              key={g.gameNumber}
              className="flex items-baseline justify-between rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">Game {g.gameNumber}</span>
              <span className="font-semibold tabular-nums">{g.scoreline}</span>
              <span className="w-28 text-right">
                {g.winnerName ?? <span className="text-muted-foreground">tied</span>}
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
      <CardFooter className="justify-between">
        <Button asChild variant="outline" size="sm">
          <Link to="/matches/$matchId" params={{ matchId }}>
            View match page
          </Link>
        </Button>
        <Button type="button" size="sm" onClick={onDone}>
          Done
        </Button>
      </CardFooter>
    </Card>
  )
}
