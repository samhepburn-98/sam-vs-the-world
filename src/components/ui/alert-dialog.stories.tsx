import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { TriangleAlertIcon } from "lucide-react"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The interrupt. Unlike a dialog it has no corner cross and clicking the
// backdrop won't dismiss it — the two buttons are the way out. Reach for it
// before anything that destroys logged data, and spell the consequence out in
// the description, because deletes cascade.

const meta = {
  title: "Primitives/Alert dialog",
  component: AlertDialog,
  args: { defaultOpen: true },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

// The manage delete confirm: named subject, cascade spelled out, cancel first.
export const Default: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete match</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sam vs Alex?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the match, its 3 games and all 187 logged rallies.
            There is no undo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

// The media slot: an icon medallion that sits above the title on a phone and
// beside it from `sm` up. Worth it when the warning should land before the
// words do.
export const WithMedia: Story = {
  name: "With media",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Discard match</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlertIcon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Discard the match in progress?</AlertDialogTitle>
          <AlertDialogDescription>
            You have logged 42 rallies against Ormond that have not synced yet.
            Discarding loses them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep logging</AlertDialogCancel>
          <AlertDialogAction>Discard</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

// `size="sm"` stays narrow and centred at every width, with the two buttons
// side by side as an even pair — the shape for a quick yes or no on a phone.
export const Compact: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">End game</Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>End game 3?</AlertDialogTitle>
          <AlertDialogDescription>
            Sam leads 11–9. The game closes and the next one starts.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>End game</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

// Anything can sit between the header and the footer — here the refusal that
// came back from the write. The dialog stays open carrying the friendly
// sentence and the action stays live for another go: the click never closes
// it, only the outcome does, so nothing looks deleted that isn't.
export const DeleteFailed: Story = {
  name: "The delete failed",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete player</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Ormond?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the player and every match they appear in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <p role="alert" className="text-sm text-destructive">
          That didn&rsquo;t save — you may be offline. Try again.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}
