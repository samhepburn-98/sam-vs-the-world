import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A dialog anchored to an edge of the screen. Reach for it when the detail
// should arrive without losing the list behind it — one rally's full card
// while the timeline stays put — or, from the bottom, when the hand holding
// the phone is at the wrong end of the screen for a centred modal.

// One rally, as the detail sheet lays it out.
const FIELDS: Array<[string, string]> = [
  ["Outcome", "Winner"],
  ["Forced", "Unforced"],
  ["Serve", "Left box · serve 2"],
  ["Shots", "14"],
  ["Ball", "Double yellow"],
]

const meta = {
  title: "Primitives/Sheet",
  component: Sheet,
  args: { defaultOpen: true },
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

// The rally detail slide-over: header, a definition list, and a footer that
// stays pinned to the bottom for stepping through the list.
export const Default: Story = {
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button variant="outline">Open rally 14</Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Game 2 · Rally 14</SheetTitle>
          <SheetDescription>
            Running score after this rally: 7–5.
          </SheetDescription>
        </SheetHeader>
        <dl className="divide-y divide-border px-4">
          {FIELDS.map(([label, value]) => (
            <div
              key={label}
              className="grid grid-cols-[8rem_1fr] items-baseline gap-2 py-1.5"
            >
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>
        <SheetFooter className="mt-auto">
          <Button variant="outline">Open in match</Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" disabled>
              <ChevronLeftIcon /> Previous
            </Button>
            <Button variant="ghost" className="flex-1">
              Next <ChevronRightIcon />
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}

// Bottom: height comes from the content, and the controls land under the
// thumb. This is the phone shape for a short list of choices. `side` takes
// any of the four edges — left and top are these two mirrored.
export const FromBottom: Story = {
  name: "From the bottom",
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger asChild>
        <Button variant="outline">Match actions</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Sam vs Alex</SheetTitle>
          <SheetDescription>14 Jul 2026 · 3–1</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <Button variant="outline">Open the match</Button>
          <Button variant="outline">Carry on logging</Button>
          <Button variant="destructive">Delete match</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
}
