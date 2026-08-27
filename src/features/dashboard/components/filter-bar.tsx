import { XIcon } from "lucide-react"

import { BallDots } from "@/components/ball-dots"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { hasActiveFilters } from "@/features/dashboard/utils/insight-filters"
import { usePlayers } from "@/lib/api/get-players"
import { Constants } from "@/lib/database.types"
import { cn } from "@/lib/utils"

import type { InsightSearch } from "@/features/dashboard/utils/insight-filters"
import type { BallType } from "@/lib/schemas/enums"

// The cross-cutting filter row (§6.1). It owns no state — the URL does. It
// takes the current search and emits the next one; the route wires that to
// navigate(), so every filtered view is shareable and the filters ride
// along the drill chain.
//
// As a broadcast graphic it's a control strip: a flat panel under the title
// with the accent bar on its edge. The bar takes the ember the moment a
// filter bites, because every number on the page below is then a filtered
// number — a page that's quietly showing a subset has to say so.

const BALLS = Constants.public.Enums.ball_type

interface FilterBarProps {
  value: InsightSearch
  onChange: (next: InsightSearch) => void
  /** The player whose page this is — never their own opponent. */
  excludePlayerId?: string
}

export function FilterBar({
  value,
  onChange,
  excludePlayerId,
}: FilterBarProps) {
  const players = usePlayers()
  const opponents = (players.data ?? []).filter((p) => p.id !== excludePlayerId)
  const active = hasActiveFilters(value)

  const patch = (next: Partial<InsightSearch>) =>
    onChange({ ...value, ...next })

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-l-4 bg-card p-3 transition-colors",
        active ? "border-primary" : "border-border"
      )}
    >
      <span
        className={cn(
          "font-heading text-xs font-bold tracking-[0.14em] uppercase",
          active ? "text-primary-strong" : "text-muted-foreground"
        )}
      >
        {active ? "Filtered" : "All time"}
      </span>

      <Select
        value={value.vs ?? "all"}
        onValueChange={(v) => patch({ vs: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Opponent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All opponents</SelectItem>
          {opponents.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              vs {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ToggleGroup
        type="single"
        variant="outline"
        className="flex-wrap"
        value={value.ball ?? ""}
        onValueChange={(v) =>
          patch({ ball: v === "" ? undefined : (v as BallType) })
        }
      >
        {BALLS.map((ball) => (
          <ToggleGroupItem
            key={ball}
            value={ball}
            aria-label={ball.replace("_", " ")}
            // the outline variant marks selection with --muted, which is two
            // hundredths of a lightness step from --card — invisible on this
            // panel. The ember ring says which ball is filtering the board,
            // and leaves the ball's own colour readable inside it.
            className="data-[state=on]:bg-accent data-[state=on]:ring-2 data-[state=on]:ring-primary data-[state=on]:ring-inset"
          >
            <BallDots ball={ball} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {/* the range takes its own row on a phone — sharing one with the balls
          and Clear squeezes both date fields to nothing */}
      <div className="flex w-full items-center gap-2 sm:w-auto">
        <Input
          type="date"
          aria-label="From date"
          className="min-w-0 flex-1 sm:w-36 sm:flex-none"
          value={value.from ?? ""}
          onChange={(e) => patch({ from: e.target.value || undefined })}
        />
        <span className="shrink-0 text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          className="min-w-0 flex-1 sm:w-36 sm:flex-none"
          value={value.to ?? ""}
          onChange={(e) => patch({ to: e.target.value || undefined })}
        />
      </div>

      {active && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange({})}
        >
          <XIcon />
          Clear
        </Button>
      )}
    </div>
  )
}
