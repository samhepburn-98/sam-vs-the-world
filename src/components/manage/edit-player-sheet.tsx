import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { EditSheet } from "@/components/manage/edit-sheet"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useUpdatePlayer } from "@/lib/queries/update-player"
import { playerEditSchema } from "@/lib/schemas/player"

import type { PlayerEditInput, PlayerRow } from "@/lib/schemas/player"

interface EditPlayerSheetProps {
  player: PlayerRow
  onClose: () => void
}

export function EditPlayerSheet({ player, onClose }: EditPlayerSheetProps) {
  const update = useUpdatePlayer()
  const form = useForm<PlayerEditInput>({
    resolver: zodResolver(playerEditSchema),
    defaultValues: { name: player.name, handedness: player.handedness },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((input) => {
    update.mutate(
      { id: player.id, ...input },
      { onSuccess: onClose },
    )
  })

  return (
    <EditSheet
      open
      title={`Edit ${player.name}`}
      description="Changes apply everywhere this player appears."
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <FieldGroup>
          <Field data-invalid={errors.name ? true : undefined}>
            <FieldLabel htmlFor="player-name">Name</FieldLabel>
            <Input id="player-name" {...form.register("name")} />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </Field>
          <Controller
            control={form.control}
            name="handedness"
            render={({ field }) => (
              <Field>
                <FieldLabel>Handedness</FieldLabel>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={field.value ?? ""}
                  onValueChange={(v) => field.onChange(v === "" ? null : v)}
                >
                  <ToggleGroupItem value="left">Left</ToggleGroupItem>
                  <ToggleGroupItem value="right">Right</ToggleGroupItem>
                </ToggleGroup>
              </Field>
            )}
          />
          {update.isError && (
            <p role="alert" className="text-destructive text-sm">
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
    </EditSheet>
  )
}
