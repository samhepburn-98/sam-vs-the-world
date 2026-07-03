import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

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
import { friendlyWriteError } from "@/lib/queries/friendly-errors"
import { useUpdateGame } from "@/lib/queries/update-game"
import { gameEditSchema } from "@/lib/schemas/game"

import type { GameBrowserRow, GameEditInput } from "@/lib/schemas/game"

interface EditGameSheetProps {
  game: GameBrowserRow
  onClose: () => void
}

export function EditGameSheet({ game, onClose }: EditGameSheetProps) {
  const update = useUpdateGame()
  const form = useForm<GameEditInput>({
    resolver: zodResolver(gameEditSchema),
    defaultValues: { gameNumber: game.game_number },
  })
  const { errors } = form.formState

  const submit = form.handleSubmit((input) => {
    update.mutate({ id: game.id, ...input }, { onSuccess: onClose })
  })

  return (
    <EditSheet
      open
      title={`Edit game ${game.game_number}`}
      description="Only the game number is stored — everything else derives from its rallies."
      onClose={onClose}
    >
      <form onSubmit={(e) => void submit(e)} noValidate>
        <FieldGroup>
          <Field data-invalid={errors.gameNumber ? true : undefined}>
            <FieldLabel htmlFor="game-number">Game number</FieldLabel>
            <Input
              id="game-number"
              type="number"
              min={1}
              {...form.register("gameNumber", { valueAsNumber: true })}
            />
            {errors.gameNumber && (
              <FieldError>{errors.gameNumber.message}</FieldError>
            )}
          </Field>
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
