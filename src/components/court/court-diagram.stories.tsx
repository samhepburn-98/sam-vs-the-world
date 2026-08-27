import { CourtDiagram } from "@/components/court/court-diagram"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The court floor plan at true proportions (6.4m × 9.75m), stroked in
// currentColor so it takes the tone of whatever holds it. Reach for it raw in
// two places: as the mark above a page's own title, the way the login card
// carries it, and as the chart under "Win rate by serve side", where
// leftShare/rightShare shade the two service boxes. For an empty state, use
// CourtEmptyMedia instead — it fixes the size and tone so every nothing-here
// surface in the app matches.

// One size for every story here, so the shading is the only thing that moves.
const SIZE = "h-40 w-[105px]"

const meta = {
  title: "Layouts/Court diagram",
  component: CourtDiagram,
  args: { className: SIZE },
} satisfies Meta<typeof CourtDiagram>

export default meta
type Story = StoryObj<typeof meta>

// No shares given: the bare mark, inheriting the text colour around it.
export const Default: Story = {}

// The shading as the app actually uses it — a win rate per service box. The
// two are independent rates, not a split: they never have to add up to 100%,
// and the deeper box is simply the better one to serve from.
export const ServeSideWinRate: Story = {
  name: "Serve-side win rate",
  args: {
    leftShare: 0.71,
    rightShare: 0.48,
    label: "Win rate by serve side: 71% from the left box, 48% from the right",
  },
}

// A measured zero is not the same as no measurement. A share of 0 still paints
// its box at the floor opacity, so "we looked and it never happened" reads
// differently from "nobody has served from that box yet" — which is why the
// serve page passes undefined rather than 0 for a box with no serves in it.
export const ZeroVersusUnset: Story = {
  name: "Zero versus unset",
  render: () => (
    <div className="flex items-start gap-10">
      <figure className="flex flex-col items-center gap-2">
        <CourtDiagram
          className={SIZE}
          leftShare={0}
          rightShare={0}
          label="No rallies won from either service box"
        />
        <figcaption className="text-xs text-muted-foreground">
          Measured zero — still shaded.
        </figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-2">
        <CourtDiagram className={SIZE} />
        <figcaption className="text-xs text-muted-foreground">
          No shares given — bare lines.
        </figcaption>
      </figure>
    </div>
  ),
}
