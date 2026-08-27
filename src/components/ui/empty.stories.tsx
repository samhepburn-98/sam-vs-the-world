import { Link } from "@tanstack/react-router"
import { PlusIcon } from "lucide-react"

import { CourtEmptyMedia } from "@/components/court/court-empty"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

import { withRouter } from "#storybook/decorators"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The nothing-here surface: a centred stack of media, title and description
// that fills the space a list would have taken. Reach for it whenever a
// query comes back with no rows — the app's rule is that no empty surface is
// left bare, and the court motif is the shared graphic that makes them a set.

const meta = {
  title: "Primitives/Empty",
  component: Empty,
  args: {
    children: (
      <EmptyHeader>
        <CourtEmptyMedia />
        <EmptyTitle>No matches yet</EmptyTitle>
        <EmptyDescription>
          Set up the first match above and start logging.
        </EmptyDescription>
      </EmptyHeader>
    ),
  },
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// With a way out. Only offer the action when the reader can actually take it
// — a visitor sees the description alone, the owner gets the button.
export const WithAction: Story = {
  name: "With an action",
  decorators: [withRouter],
  args: {
    children: (
      <>
        <EmptyHeader>
          <CourtEmptyMedia />
          <EmptyTitle>No players yet</EmptyTitle>
          <EmptyDescription>
            Log your first match to build the roster.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/entry">Log a match</Link>
          </Button>
        </EmptyContent>
      </>
    ),
  },
}

// The primitive's own icon tile, for an empty panel too small to carry the
// court diagram. Everywhere with room, prefer the court motif above.
export const IconMedia: Story = {
  name: "Icon media",
  args: {
    className: "p-8",
    children: (
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PlusIcon />
        </EmptyMedia>
        <EmptyTitle>No rallies yet</EmptyTitle>
        <EmptyDescription>
          Rallies behind this stat appear here once there are any to show.
        </EmptyDescription>
      </EmptyHeader>
    ),
  },
}
