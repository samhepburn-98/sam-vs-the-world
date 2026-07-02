import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

import type { PlayerSummary } from "@/lib/schemas/player"

const NEW_PLAYER = "__new__"

interface PlayerSelectProps {
  id?: string
  players: Array<PlayerSummary>
  value: string
  onChange: (playerId: string) => void
  onCreatePlayer: (name: string) => Promise<PlayerSummary>
  placeholder?: string
}

export function PlayerSelect({
  id,
  players,
  value,
  onChange,
  onCreatePlayer,
  placeholder = "Pick a player",
}: PlayerSelectProps) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)

  if (creating) {
    return (
      <div className="flex gap-2">
        <Input
          autoFocus
          value={name}
          placeholder="Player name"
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          type="button"
          disabled={saving || name.trim().length === 0}
          onClick={() => {
            void (async () => {
              setSaving(true)
              try {
                const player = await onCreatePlayer(name.trim())
                onChange(player.id)
                setCreating(false)
                setName("")
              } finally {
                setSaving(false)
              }
            })()
          }}
        >
          {saving && <Spinner data-icon="inline-start" />}
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setCreating(false)}
        >
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={(v) => {
        if (v === NEW_PLAYER) setCreating(true)
        else onChange(v)
      }}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {players.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectGroup>
        {players.length > 0 && <SelectSeparator />}
        <SelectGroup>
          <SelectItem value={NEW_PLAYER}>New player…</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
