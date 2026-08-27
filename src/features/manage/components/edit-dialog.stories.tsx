import { useForm } from "react-hook-form"

import { HouseRulesFields } from "@/components/rally/house-rules-fields"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
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
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EditDialog } from "@/features/manage/components/edit-dialog"

import { ALEX, ROSTER, SAM } from "#storybook/fixtures"

import type { HouseRulesForm } from "@/components/rally/house-rules-fields"
import type { Meta, StoryObj } from "@storybook/react-vite"

// The shell each /manage edit form is dropped into: title, one line of
// consequence, and a body that scrolls at 85% of the viewport rather than
// pushing its own buttons off the bottom. Reach for it when a row is edited
// in place — it holds no form state of its own, so the body owns the fields,
// the save and the error.

/** The dialog is only a shell, so a story of it has to be somebody's form.
 *  This is the player edit body, field for field. */
function PlayerEditBody({ error }: { error?: string }) {
  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="story-player-name">Name</FieldLabel>
          <Input id="story-player-name" defaultValue={SAM.name} />
        </Field>
        <Field>
          <FieldLabel>Handedness</FieldLabel>
          <ToggleGroup type="single" variant="outline" defaultValue="right">
            <ToggleGroupItem value="left">Left</ToggleGroupItem>
            <ToggleGroupItem value="right">Right</ToggleGroupItem>
          </ToggleGroup>
        </Field>
        <Field>
          <FieldLabel htmlFor="story-player-photo">Photo</FieldLabel>
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-muted-foreground"
            >
              {SAM.name.charAt(0)}
            </span>
            <Input
              id="story-player-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </div>
          <FieldDescription>
            Shown on the compare cards. Any size — it's shrunk before upload.
          </FieldDescription>
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </FieldGroup>
    </form>
  )
}

/** The match edit body: both players, the date, the venue, the notes and the
 *  whole house-rules set, which is what makes it taller than the dialog. */
function MatchEditBody() {
  const form = useForm<HouseRulesForm>({
    defaultValues: {
      houseRules: {
        format: 5,
        targetScore: 11,
        tiebreak: "win_by_2",
        servesPerPoint: 2,
        letResetsServe: false,
        ballType: "double_yellow",
      },
    },
  })

  const playerSelect = (label: string, playerId: string) => (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select defaultValue={playerId}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ROSTER.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </Field>
  )

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate>
      <FieldGroup>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {playerSelect("Player 1", SAM.id)}
          {playerSelect("Player 2", ALEX.id)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="story-edit-date">Date</FieldLabel>
            <Input id="story-edit-date" type="date" defaultValue="2026-08-14" />
          </Field>
          <Field>
            <FieldLabel htmlFor="story-edit-venue">Venue (optional)</FieldLabel>
            <Input id="story-edit-venue" defaultValue="Ormond Leisure Centre" />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="story-edit-notes">Notes (optional)</FieldLabel>
          <Textarea
            id="story-edit-notes"
            rows={3}
            defaultValue="Cold court, new ball from game two."
          />
        </Field>
        <HouseRulesFields
          control={form.control}
          register={form.register}
          errors={form.formState.errors}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </FieldGroup>
    </form>
  )
}

const meta = {
  title: "Manage/Edit dialog",
  component: EditDialog,
  args: {
    open: true,
    title: `Edit ${SAM.name}`,
    description: "Changes apply everywhere this player appears.",
    onClose: () => undefined,
    children: <PlayerEditBody />,
  },
} satisfies Meta<typeof EditDialog>

export default meta
type Story = StoryObj<typeof meta>

// A short body. The description is the consequence, not a restatement of the
// title — editing a player renames them on every card and every match they
// have ever played.
export const Default: Story = {}

// The match body, house rules and all. Past the dialog's height cap the body
// scrolls inside it, so the save buttons stay reachable on a phone instead of
// hanging below the fold.
export const ALongForm: Story = {
  name: "A long form",
  args: {
    title: "Edit match",
    description: "Once rallies are logged, the players can't be swapped out.",
    children: <MatchEditBody />,
  },
}

// The save was refused. The dialog stays open with the friendly sentence and
// the edits still in the fields — the row is visibly unsaved, never silently
// reverted behind a closing dialog.
export const SaveFailed: Story = {
  name: "Save failed",
  args: {
    children: (
      <PlayerEditBody error="The save failed — check your connection and try again." />
    ),
  },
}
