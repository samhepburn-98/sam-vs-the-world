import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"

import { EditDialog } from "@/features/manage/components/edit-dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { friendlyWriteError } from "@/lib/api/friendly-errors"
import { useUpdatePlayer } from "@/features/manage/api/update-player"
import { downscaleImage } from "@/lib/images/downscale"
import { playerEditSchema } from "@/lib/schemas/player"

import type { PlayerEditInput, PlayerRow } from "@/lib/schemas/player"

interface EditPlayerDialogProps {
  player: PlayerRow
  onClose: () => void
}

// don't even try to decode something absurd — the downscale would still
// shrink it, but a 50 MB "photo" is almost certainly a mistake
const MAX_PICKED_BYTES = 10 * 1024 * 1024

export function EditPlayerDialog({ player, onClose }: EditPlayerDialogProps) {
  const update = useUpdatePlayer()
  const form = useForm<PlayerEditInput>({
    resolver: zodResolver(playerEditSchema),
    defaultValues: { name: player.name, handedness: player.handedness },
  })
  const { errors } = form.formState

  // the picked photo lives outside the zod schema (a File isn't form data);
  // it's downscaled at save time and rides along as avatarBlob
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const preview = useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo]
  )
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pickPhoto = (file: File | null) => {
    setPhotoError(
      file && file.size > MAX_PICKED_BYTES
        ? "That photo is too large — try one under 10 MB."
        : null
    )
    setPhoto(file && file.size <= MAX_PICKED_BYTES ? file : null)
  }

  const submit = form.handleSubmit(async (input) => {
    let avatarBlob: Blob | undefined
    if (photo) {
      try {
        avatarBlob = await downscaleImage(photo)
      } catch (err) {
        // NotAnImageError carries a friendly sentence already
        setPhotoError(
          err instanceof Error ? err.message : "That photo couldn't be read."
        )
        return
      }
    }
    update.mutate(
      { id: player.id, avatarBlob, ...input },
      { onSuccess: onClose }
    )
  })

  const shownAvatar = preview ?? player.avatar_url

  return (
    <EditDialog
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
          <Field data-invalid={photoError ? true : undefined}>
            <FieldLabel htmlFor="player-photo">Photo</FieldLabel>
            <div className="flex items-center gap-3">
              {shownAvatar ? (
                <img
                  src={shownAvatar}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground"
                >
                  {player.name.charAt(0)}
                </span>
              )}
              <Input
                id="player-photo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
              />
            </div>
            <FieldDescription>
              Shown on the compare cards. Any size — it's shrunk before upload.
            </FieldDescription>
            {photoError && <FieldError>{photoError}</FieldError>}
          </Field>
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
