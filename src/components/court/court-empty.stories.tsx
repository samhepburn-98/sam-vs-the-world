import { CourtEmptyMedia } from "@/components/court/court-empty"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The court motif pre-sized and pre-toned for empty states — one size, one
// muted tone, no props to get wrong. Drop it in as the first child of an
// <EmptyHeader> and every nothing-here surface reads as one family; reach for
// EmptyMedia variant="icon" only in panels with no room for the court.

const meta = {
  title: "Layouts/Court empty media",
  component: CourtEmptyMedia,
} satisfies Meta<typeof CourtEmptyMedia>

export default meta
type Story = StoryObj<typeof meta>

// The graphic on its own, at the size every empty state gets.
export const Default: Story = {}

// The same mark on two real surfaces that mean different things: nothing
// logged yet (the logger's recent matches) and nothing left after filtering
// (the matches list). Only the words change — the graphic never does.
export const InEmptyStates: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      <Empty>
        <EmptyHeader>
          <CourtEmptyMedia />
          <EmptyTitle className="font-heading">No matches yet</EmptyTitle>
          <EmptyDescription>
            Set up the first match above and start logging.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
      <Empty>
        <EmptyHeader>
          <CourtEmptyMedia />
          <EmptyTitle className="font-heading">No matches found</EmptyTitle>
          <EmptyDescription>
            Nothing matches these filters yet.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
}
