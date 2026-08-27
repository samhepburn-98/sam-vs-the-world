import { Skeleton } from "@/components/ui/skeleton"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A pulsing block that holds the space a panel is about to fill. Size it to
// the real thing — a chart's height, a cell's width — so nothing jumps when
// the data lands. It is the app's answer to "no data yet, still fetching",
// never to "no data at all": that case gets an Empty with an honest sentence.

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  args: { className: "h-32 w-full max-w-md rounded-2xl" },
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

// One block standing in for a whole panel, as the head-to-head panel does
// while its query is in flight.
export const Default: Story = {}

// Inside a table, the placeholder takes the shape of the cells: a fixed row
// count at cell width, so the header does not slide down when rows arrive.
export const TableRows: Story = {
  render: () => (
    <div className="max-w-md">
      <div className="flex gap-4 border-b py-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        <span className="flex-1">Date</span>
        <span className="flex-1">Opponent</span>
        <span className="flex-1">Result</span>
      </div>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-4 border-b py-3 last:border-b-0">
          <Skeleton className="h-4 w-full max-w-24 flex-1" />
          <Skeleton className="h-4 w-full max-w-24 flex-1" />
          <Skeleton className="h-4 w-full max-w-24 flex-1" />
        </div>
      ))}
    </div>
  ),
}
