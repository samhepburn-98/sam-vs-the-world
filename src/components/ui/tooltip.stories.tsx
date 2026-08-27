import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { PencilIcon } from "lucide-react"

import type { Decorator, Meta, StoryObj } from "@storybook/react-vite"

// A hover or focus hint on a dark pill with an arrow. Reach for it where the
// interface is deliberately terse — the three-letter attribute codes, an
// icon-only button — and the explanation would otherwise cost a line of
// layout. Never for anything a reader must see: it isn't there on a phone.

// Radix needs a provider above every tooltip; the app puts one around the
// compare cards.
const withTooltipProvider: Decorator = (Story) => (
  <TooltipProvider>
    <Story />
  </TooltipProvider>
)

const meta = {
  title: "Primitives/Tooltip",
  component: Tooltip,
  decorators: [withTooltipProvider],
  args: { defaultOpen: true },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

// The compare card's stat explainer: the code says SRV, the tooltip says what
// it measures and hands over the receipt. Open on load; hover or tab to it
// once it has been dismissed. The trigger is a plain div, so — as on the card
// — it needs `tabIndex` before a keyboard can reach the hint at all.
export const Default: Story = {
  render: (args) => (
    <div className="py-16">
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <div
            tabIndex={0}
            className="inline-flex w-fit cursor-help items-baseline gap-2 rounded-sm"
          >
            <span className="text-3xl font-extrabold tabular-nums">56</span>
            <span className="text-sm font-medium text-muted-foreground">
              SRV
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Points won on your own serve: 34 of 61 serve rallies won
        </TooltipContent>
      </Tooltip>
    </div>
  ),
}

// An icon-only control has no visible name. The tooltip carries it for the
// mouse; the sr-only text carries it for everyone else.
export const OnIconButton: Story = {
  name: "On an icon button",
  render: (args) => (
    <div className="py-16">
      <Tooltip {...args}>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <PencilIcon />
            <span className="sr-only">Edit match</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit match</TooltipContent>
      </Tooltip>
    </div>
  ),
}

// The arrow follows the side, and the pill flips itself when it would run off
// the screen — so pick the side that suits the layout, not the one that fits.
export const Placement: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 justify-items-center gap-24 py-24">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} {...args}>
          <TooltipTrigger asChild>
            <Button variant="outline" className="font-mono text-xs">
              {`side="${side}"`}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>Longest rally: 23 shots</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}
