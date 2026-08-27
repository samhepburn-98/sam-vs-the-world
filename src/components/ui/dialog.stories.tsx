import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The centred modal: focus trapped, Escape closes, the page dimmed behind it.
// Reach for it when something needs the whole screen's attention but not a
// route of its own — the stats glossary, a manage edit form. Every story opens
// on load so the panel is on screen; the trigger underneath still works.

// The glossary body, spelled out the way the compare page spells it out.
const GLOSSARY = [
  { code: "SRV", name: "Serve", detail: "Points won on your own serve" },
  { code: "RET", name: "Return", detail: "Points won when receiving serve" },
  { code: "ATT", name: "Attack", detail: "Short rallies (1–4 shots) won" },
  { code: "GRD", name: "Grind", detail: "Extended rallies (5+ shots) won" },
]

// The logger's real keys, as the `?` cheat sheet lists them.
const SHORTCUTS: Array<[string, string]> = [
  ["s", "Left player won"],
  ["d", "Right player won"],
  ["l", "Let (saves immediately)"],
  ["↵", "Save rally"],
  ["u", "Undo"],
]

const meta = {
  title: "Primitives/Dialog",
  component: Dialog,
  args: { defaultOpen: true },
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

// Read-only explainer: a quiet trigger, a title, and content that may run
// long. Nothing to answer, so the corner cross, Escape and a click outside are
// all fine ways out.
export const Default: Story = {
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          What do these mean?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>What the stats mean</DialogTitle>
          <DialogDescription>
            Every attribute is a measured win rate from your logged rallies. A
            dash means there aren&rsquo;t enough games to be fair yet.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {GLOSSARY.map((g) => (
            <div key={g.code} className="flex gap-3">
              <dt className="w-10 shrink-0 pt-0.5 text-xs font-semibold tracking-[0.06em] text-muted-foreground">
                {g.code}
              </dt>
              <dd>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-sm text-muted-foreground">{g.detail}</p>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  ),
}

// The manage edit shell: a form in a dialog, actions in the footer. A failed
// save keeps the dialog open with the error — never a silent revert.
export const WithFormAndFooter: Story = {
  name: "With a form and footer",
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Sam</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sam</DialogTitle>
          <DialogDescription>
            Changes apply everywhere this player appears.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="story-player-name">Name</FieldLabel>
          <Input id="story-player-name" defaultValue="Sam" />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

// Corner cross off, footer close on: for a panel the reader should leave
// deliberately. Escape and the backdrop still dismiss it.
export const WithoutCornerClose: Story = {
  name: "Without the corner close",
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild>
        <Button variant="outline">Keyboard shortcuts</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            The logger is built for one hand on the keyboard — these work
            anywhere on the logging screen.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-1.5">
          {SHORTCUTS.map(([key, label]) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <Kbd className="h-5 min-w-5 text-[11px]">{key}</Kbd>
              {label}
            </li>
          ))}
        </ul>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  ),
}
