import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The plain panel: rounded, hairline-ringed, with one `--card-spacing` token
// driving header, content and footer padding together. Reach for it when a
// block needs its own edge and there is no broadcast piece for the job — the
// finish-match summary is the app's own use. A footer or header only gains
// its inner padding once you give it `border-t` / `border-b`.

const GAMES = ["11-7", "9-11", "11-8", "11-6"]

function GameList() {
  return (
    <ol className="flex flex-col gap-1.5">
      {GAMES.map((score, i) => (
        <li
          key={i}
          className="flex items-baseline justify-between rounded-md border px-3 py-2"
        >
          <span className="text-muted-foreground">Game {i + 1}</span>
          <span className="font-semibold tabular-nums">{score}</span>
        </li>
      ))}
    </ol>
  )
}

const meta = {
  title: "Primitives/Card",
  component: Card,
  args: {
    className: "max-w-sm",
    children: (
      <>
        <CardHeader>
          <CardTitle>Sam beat Alex</CardTitle>
          <CardDescription>Best of five · 9 Jul</CardDescription>
        </CardHeader>
        <CardContent>
          <GameList />
        </CardContent>
        <CardFooter className="justify-between border-t">
          <span className="text-muted-foreground">4 games · 74 rallies</span>
          <Button size="sm">Done</Button>
        </CardFooter>
      </>
    ),
  },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// A card action parks a control on the header's right: the header switches to
// a two-column grid on its own, so the title and description keep their width.
export const WithAction: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Sam beat Alex</CardTitle>
          <CardDescription>Best of five · 9 Jul</CardDescription>
          <CardAction>
            <Button variant="outline" size="xs">
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <GameList />
        </CardContent>
      </>
    ),
  },
}

// The tighter spacing token, for a card sitting inside another surface or in
// a dense column where the default six-unit gutter reads as slack.
export const Small: Story = {
  args: { size: "sm" },
}
