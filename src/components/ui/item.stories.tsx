import { Link } from "@tanstack/react-router"
import { ChevronRightIcon } from "lucide-react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item"

import { withRouter } from "#storybook/decorators"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A list row with fixed slots — media, content, actions — so a stack of rows
// lines up without each one inventing its own grid. This is what the match
// history collapses to below `sm`, where a table would need side-scrolling.
// Rendered `asChild` around a <Link>, the whole row becomes the target.

function Verdict({ won }: { won: boolean }) {
  return (
    <span
      className={
        won
          ? "inline-flex size-6 items-center justify-center rounded-md bg-success/15 text-xs font-bold text-success"
          : "inline-flex size-6 items-center justify-center rounded-md bg-error/15 text-xs font-bold text-error"
      }
    >
      {won ? "W" : "L"}
    </span>
  )
}

function ScorePill({ score }: { score: string }) {
  return (
    <span className="inline-block rounded-md border border-foreground/25 px-1.5 py-0.5 text-xs tabular-nums">
      {score}
    </span>
  )
}

const SIZES = [
  { size: "default", label: "Default" },
  { size: "sm", label: "Small" },
  { size: "xs", label: "Extra small" },
] as const

const meta = {
  title: "Primitives/Item",
  component: Item,
  args: {
    className: "max-w-md",
    children: (
      <>
        <ItemMedia>
          <Verdict won />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>
            Alex
            <span className="font-normal text-muted-foreground tabular-nums">
              · 3–1
            </span>
          </ItemTitle>
          <div className="flex flex-wrap gap-1">
            <ScorePill score="11-7" />
            <ScorePill score="9-11" />
            <ScorePill score="11-8" />
            <ScorePill score="11-6" />
          </div>
          <ItemDescription className="text-xs">
            Took the long rallies all night.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="self-start text-xs text-muted-foreground tabular-nums">
          9 Jul
        </ItemActions>
      </>
    ),
  },
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "muted"] },
    size: { control: "select", options: ["default", "sm", "xs"] },
  },
} satisfies Meta<typeof Item>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Default is border-free, for rows that already sit inside a panel; outline
// and muted give a row its own edge when it stands alone on the page.
export const Variants: Story = {
  render: () => (
    <ItemGroup className="max-w-md">
      <Item>
        <ItemContent>
          <ItemTitle>Default</ItemTitle>
          <ItemDescription>
            No border — the enclosing panel is the only card.
          </ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline</ItemTitle>
          <ItemDescription>A hairline edge of its own.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted</ItemTitle>
          <ItemDescription>
            A filled row, for the one that needs weight.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
}

// The size sets the row's padding and the enclosing group's gap together, so
// a dense list stays dense end to end. One group per size here — the group
// reads the size off its rows, so mixing sizes inside one group would collapse
// all three gaps to the tightest.
export const Sizes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-6">
      {SIZES.map(({ size, label }) => (
        <div key={size} className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <ItemGroup>
            <Item variant="outline" size={size}>
              <ItemMedia>
                <Verdict won />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Alex</ItemTitle>
              </ItemContent>
            </Item>
            <Item variant="outline" size={size}>
              <ItemMedia>
                <Verdict won={false} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Ormond</ItemTitle>
              </ItemContent>
            </Item>
          </ItemGroup>
        </div>
      ))}
    </div>
  ),
}

// How the match history uses it: every row is the link, ruled apart by an
// item separator rather than a per-row background, so the panel around them
// stays the only card on screen.
export const MatchRows: Story = {
  name: "Match rows",
  decorators: [withRouter],
  render: () => (
    <ItemGroup className="max-w-md">
      <Item asChild size="sm" className="px-0">
        <Link to="/matches/$matchId" params={{ matchId: "m1" }}>
          <ItemMedia>
            <Verdict won />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              Alex
              <span className="font-normal text-muted-foreground tabular-nums">
                · 3–1
              </span>
            </ItemTitle>
            <ItemDescription className="text-xs">9 Jul</ItemDescription>
          </ItemContent>
          <ItemActions className="text-muted-foreground">
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </Link>
      </Item>
      <ItemSeparator />
      <Item asChild size="sm" className="px-0">
        <Link to="/matches/$matchId" params={{ matchId: "m2" }}>
          <ItemMedia>
            <Verdict won={false} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              Ormond
              <span className="font-normal text-muted-foreground tabular-nums">
                · 1–3
              </span>
            </ItemTitle>
            <ItemDescription className="text-xs">2 Jul</ItemDescription>
          </ItemContent>
          <ItemActions className="text-muted-foreground">
            <ChevronRightIcon className="size-4" />
          </ItemActions>
        </Link>
      </Item>
    </ItemGroup>
  ),
}
