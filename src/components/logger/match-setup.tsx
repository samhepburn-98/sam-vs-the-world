import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { BallDots } from "@/components/ball-dots"
import { PlayerSelect } from "@/components/logger/player-select"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { matchSetupSchema } from "@/lib/schemas/match"
import { DEFAULT_HOUSE_RULES } from "@/lib/scoring"

import type { PlayerSummary } from "@/lib/schemas/player"
import type { MatchSetupInput } from "@/lib/schemas/match"

interface MatchSetupProps {
  players: Array<PlayerSummary>
  onCreatePlayer: (name: string) => Promise<PlayerSummary>
  /** returns a friendly error, or null on success */
  onStart: (input: MatchSetupInput) => Promise<string | null>
}

const BALL_LABELS = {
  blue: "Blue",
  red: "Red",
  yellow: "Yellow",
  double_yellow: "Dbl yellow",
} as const

export function MatchSetup({
  players,
  onCreatePlayer,
  onStart,
}: MatchSetupProps) {
  const form = useForm<MatchSetupInput>({
    resolver: zodResolver(matchSetupSchema),
    defaultValues: {
      player1Id: "",
      player2Id: "",
      date: new Date().toISOString().slice(0, 10),
      venue: "",
      firstServerId: "",
      houseRules: {
        format: null,
        targetScore: DEFAULT_HOUSE_RULES.targetScore,
        tiebreak: DEFAULT_HOUSE_RULES.tiebreak,
        servesPerPoint: DEFAULT_HOUSE_RULES.servesPerPoint,
        letResetsServe: DEFAULT_HOUSE_RULES.letResetsServe,
        ballType: "double_yellow",
      },
    },
  })
  const { errors, isSubmitting } = form.formState
  const rootError = errors.root?.message
  const [player1Id, player2Id] = form.watch(["player1Id", "player2Id"])
  const selectedPlayers = players.filter(
    (p) => p.id === player1Id || p.id === player2Id,
  )

  const submit = form.handleSubmit(async (input) => {
    const error = await onStart(input)
    if (error) form.setError("root", { message: error })
  })

  return (
    <form onSubmit={(e) => void submit(e)} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="player1Id"
            render={({ field }) => (
              <Field data-invalid={errors.player1Id ? true : undefined}>
                <FieldLabel htmlFor="player1">Player 1</FieldLabel>
                <PlayerSelect
                  id="player1"
                  players={players}
                  value={field.value}
                  onChange={field.onChange}
                  onCreatePlayer={onCreatePlayer}
                />
                {errors.player1Id && (
                  <FieldError>{errors.player1Id.message}</FieldError>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="player2Id"
            render={({ field }) => (
              <Field data-invalid={errors.player2Id ? true : undefined}>
                <FieldLabel htmlFor="player2">Player 2</FieldLabel>
                <PlayerSelect
                  id="player2"
                  players={players}
                  value={field.value}
                  onChange={field.onChange}
                  onCreatePlayer={onCreatePlayer}
                />
                {errors.player2Id && (
                  <FieldError>{errors.player2Id.message}</FieldError>
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="firstServerId"
          render={({ field }) => (
            <Field data-invalid={errors.firstServerId ? true : undefined}>
              <FieldLabel>Who serves first?</FieldLabel>
              {selectedPlayers.length < 2 ? (
                <p className="text-muted-foreground text-sm">
                  Pick both players first.
                </p>
              ) : (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  {selectedPlayers.map((p) => (
                    <ToggleGroupItem key={p.id} value={p.id}>
                      {p.name}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              {errors.firstServerId && (
                <FieldError>{errors.firstServerId.message}</FieldError>
              )}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="date">Date</FieldLabel>
            <Input id="date" type="date" {...form.register("date")} />
          </Field>
          <Field>
            <FieldLabel htmlFor="venue">Venue (optional)</FieldLabel>
            <Input id="venue" {...form.register("venue")} />
          </Field>
        </div>

        <FieldSet>
          <FieldLegend>House rules</FieldLegend>
          <FieldGroup>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="houseRules.format"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="format">Format</FieldLabel>
                    <Select
                      value={field.value === null ? "casual" : String(field.value)}
                      onValueChange={(v) =>
                        field.onChange(v === "casual" ? null : Number(v))
                      }
                    >
                      <SelectTrigger id="format" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="casual">
                            Casual — just play games
                          </SelectItem>
                          {[1, 3, 5, 7, 9].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              Best of {n}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
              <Field data-invalid={errors.houseRules?.targetScore ? true : undefined}>
                <FieldLabel htmlFor="target">Points per game</FieldLabel>
                <Input
                  id="target"
                  type="number"
                  min={1}
                  max={99}
                  {...form.register("houseRules.targetScore", {
                    valueAsNumber: true,
                  })}
                />
                {errors.houseRules?.targetScore && (
                  <FieldError>{errors.houseRules.targetScore.message}</FieldError>
                )}
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="houseRules.tiebreak"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>At 10–10</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={field.value}
                      onValueChange={(v) => v && field.onChange(v)}
                    >
                      <ToggleGroupItem value="win_by_2">Win by 2</ToggleGroupItem>
                      <ToggleGroupItem value="sudden_death">
                        Sudden death
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="houseRules.servesPerPoint"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Serves per point</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={String(field.value)}
                      onValueChange={(v) => v && field.onChange(Number(v))}
                    >
                      <ToggleGroupItem value="2">Two serves</ToggleGroupItem>
                      <ToggleGroupItem value="1">Single serve</ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="houseRules.letResetsServe"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>After a let</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={field.value ? "reset" : "keep"}
                      onValueChange={(v) => v && field.onChange(v === "reset")}
                    >
                      <ToggleGroupItem value="keep">Keep serve no.</ToggleGroupItem>
                      <ToggleGroupItem value="reset">
                        Reset to 1st serve
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="houseRules.ballType"
                render={({ field }) => (
                  <Field>
                    <FieldLabel>Ball</FieldLabel>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v === "" ? null : v)}
                    >
                      {(
                        Object.keys(BALL_LABELS) as Array<
                          keyof typeof BALL_LABELS
                        >
                      ).map((b) => (
                        <ToggleGroupItem key={b} value={b}>
                          <BallDots ball={b} />
                          {BALL_LABELS[b]}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </FieldSet>

        {rootError && (
          <p role="alert" className="text-destructive text-sm">
            {rootError}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          Start logging
        </Button>
      </FieldGroup>
    </form>
  )
}
