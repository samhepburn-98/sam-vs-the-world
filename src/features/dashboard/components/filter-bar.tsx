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

import type { InsightSearch } from "@/features/dashboard/utils/insight-filters"
import type { BallType } from "@/lib/schemas/enums"

// The cross-cutting filter row (§6.1). It owns no state — the URL does. It
// takes the current search and emits the next one; the route wires that to
// navigate(), so every filtered view is shareable and the filters ride
// along the drill chain.

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

  const patch = (next: Partial<InsightSearch>) =>
    onChange({ ...value, ...next })

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={value.vs ?? "all"}
        onValueChange={(v) => patch({ vs: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="w-48" aria-label="Opponent">
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
          >
            <BallDots ball={ball} />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="From date"
          className="w-40"
          value={value.from ?? ""}
          onChange={(e) => patch({ from: e.target.value || undefined })}
        />
        <span className="text-sm text-muted-foreground">to</span>
        <Input
          type="date"
          aria-label="To date"
          className="w-40"
          value={value.to ?? ""}
          onChange={(e) => patch({ to: e.target.value || undefined })}
        />
      </div>

      {hasActiveFilters(value) && (
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
