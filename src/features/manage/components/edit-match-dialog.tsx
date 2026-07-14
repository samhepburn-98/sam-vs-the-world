import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { HouseRulesFields } from "@/components/rally/house-rules-fields"
import { EditDialog } from "@/features/manage/components/edit-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { Textarea } from "@/components/ui/textarea"
import { friendlyWriteError } from "@/lib/api/friendly-errors"
import { useUpdateMatch } from "@/lib/api/update-match"
import { matchEditSchema } from "@/lib/schemas/match"

import type { HouseRulesForm } from "@/components/rally/house-rules-fields"
import type { MatchEditInput, MatchRow } from "@/lib/schemas/match"
import type { PlayerSummary } from "@/lib/schemas/player"
import type { Control } from "react-hook-form"

interface EditMatchDialogProps {
  match: MatchRow
  players: Array<PlayerSummary>
  onClose: () => void
}

export function EditMatchDialog({
  match,
  players,
  onClose,
}: EditMatchDialogProps) {
  const update = useUpdateMatch()
  const form = useForm<MatchEditInput>({
    resolver: zodResolver(matchEditSchema),
    defaultValues: {
      date: match.date,
      player1Id: match.player1_id,
      player2Id: match.player2_id,
      venue: match.venue ?? "",
      notes: match.notes ?? "",
      houseRules: {
        format: match.format,
        targetScore: match.target_score,
        tiebreak: match.tiebreak,
        servesPerPoint: match.serves_per_point === 1 ? 1 : 2,
        letResetsServe: match.let_resets_serve,
        ballType: match.ball_type,
      },
    },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((input) => {
    update.mutate({ id: match.id, ...input }, { onSuccess: onClose })
  })

  const playerSelect = (name: "player1Id" | "player2Id", label: string) => (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <Field data-invalid={errors[name] ? true : undefined}>
          <FieldLabel>{label}</FieldLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {errors[name] && <FieldError>{errors[name].message}</FieldError>}
        </Field>
      )}
    />
  )

  return (
    <EditDialog
      open
      title="Edit match"
      description="Once rallies are logged, the players can't be swapped out."
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <FieldGroup>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {playerSelect("player1Id", "Player 1")}
            {playerSelect("player2Id", "Player 2")}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field data-invalid={errors.date ? true : undefined}>
              <FieldLabel htmlFor="edit-date">Date</FieldLabel>
              <Input id="edit-date" type="date" {...form.register("date")} />
              {errors.date && <FieldError>{errors.date.message}</FieldError>}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-venue">Venue (optional)</FieldLabel>
              <Input id="edit-venue" {...form.register("venue")} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="edit-notes">Notes (optional)</FieldLabel>
            <Textarea id="edit-notes" rows={3} {...form.register("notes")} />
          </Field>

          <HouseRulesFields
            control={form.control as unknown as Control<HouseRulesForm>}
            register={form.register}
            errors={errors}
          />

          {update.isError && (
            <p role="alert" className="text-sm text-destructive">
              {friendlyWriteError(update.error)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Spinner data-icon="inline-start" />}
              Save changes
            </Button>
          </div>
        </FieldGroup>
      </form>
    </EditDialog>
  )
}
