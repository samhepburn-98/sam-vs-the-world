import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Meta, StoryObj } from "@storybook/react-vite"

// Sections of one page that belong to the same subject — the profile's
// Summary / Stats / Matches, the manage screen's four tables. Reach for tabs
// when every panel is about the same player or match; a different subject
// wants a route, not a tab, so the view stays linkable.

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  args: { defaultValue: "matches" },
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

const Panel = ({ children }: { children: string }) => (
  <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
    {children}
  </div>
)

// The default pill list, as the manage screen wears it: four tables of the
// same database, one visible at a time. The live tab lives in the URL there,
// so a tab is a `value` the route controls, not local state.
export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-full max-w-xl">
      <TabsList aria-label="Data tables">
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="games">Games</TabsTrigger>
        <TabsTrigger value="rallies">Rallies</TabsTrigger>
        <TabsTrigger value="players">Players</TabsTrigger>
      </TabsList>
      <TabsContent value="matches" className="pt-4">
        <Panel>Every match, newest first, with venue and notes.</Panel>
      </TabsContent>
      <TabsContent value="games" className="pt-4">
        <Panel>Games, each linked back to the match it belongs to.</Panel>
      </TabsContent>
      <TabsContent value="rallies" className="pt-4">
        <Panel>
          Rallies, with the end reason and the serve that began them.
        </Panel>
      </TabsContent>
      <TabsContent value="players" className="pt-4">
        <Panel>Sam, Alex and Ormond, with handedness and match counts.</Panel>
      </TabsContent>
    </Tabs>
  ),
}

// The quieter variant: no filled track, just an underline under the live
// tab. Use it inside a card, where a second filled pill would compete with
// the card itself.
export const Line: Story = {
  render: () => (
    <Tabs defaultValue="rallies" className="w-full max-w-xl">
      <TabsList variant="line" aria-label="Match sections">
        <TabsTrigger value="rallies">Rallies</TabsTrigger>
        <TabsTrigger value="games">Games</TabsTrigger>
        <TabsTrigger value="h2h">Head to head</TabsTrigger>
      </TabsList>
      <TabsContent value="rallies" className="pt-4">
        <Panel>The 61 rallies behind the number above.</Panel>
      </TabsContent>
      <TabsContent value="games" className="pt-4">
        <Panel>Game by game: 11–8, 9–11, 11–6.</Panel>
      </TabsContent>
      <TabsContent value="h2h" className="pt-4">
        <Panel>Sam v Alex, all five meetings.</Panel>
      </TabsContent>
    </Tabs>
  ),
}

// Vertical: the list becomes a rail beside the panel, which suits a long
// list of sections on a wide screen.
export const Vertical: Story = {
  render: () => (
    <Tabs
      defaultValue="serve"
      orientation="vertical"
      className="w-full max-w-xl"
    >
      <TabsList aria-label="Stat categories">
        <TabsTrigger value="serve">Serve</TabsTrigger>
        <TabsTrigger value="return">Return</TabsTrigger>
        <TabsTrigger value="rally">Rally</TabsTrigger>
        <TabsTrigger value="errors">Errors</TabsTrigger>
      </TabsList>
      <TabsContent value="serve">
        <Panel>34 of 61 points won behind the serve.</Panel>
      </TabsContent>
      <TabsContent value="return">
        <Panel>22 of 58 points won receiving.</Panel>
      </TabsContent>
      <TabsContent value="rally">
        <Panel>5.4 shots on average, longest 23.</Panel>
      </TabsContent>
      <TabsContent value="errors">
        <Panel>41 errors, 18 of them into the tin.</Panel>
      </TabsContent>
    </Tabs>
  ),
}

// How the profile page dresses the list: full width, square, condensed
// heading type, and the live segment taking the ember fill. The primitive
// carries the behaviour; the Broadcast look is all class names.
export const BroadcastSegments: Story = {
  name: "Broadcast segments",
  render: () => (
    <Tabs defaultValue="summary" className="w-full max-w-xl">
      <TabsList
        aria-label="Profile sections"
        className="w-full gap-0.5 rounded-none bg-transparent p-0"
      >
        {[
          { value: "summary", label: "Summary" },
          { value: "stats", label: "Stats" },
          { value: "matches", label: "Matches" },
        ].map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex-1 rounded-none border-0 bg-card font-heading text-sm font-extrabold tracking-[0.1em] text-muted-foreground uppercase data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="summary" className="pt-4">
        <Panel>Sam's shape, strengths and weaknesses.</Panel>
      </TabsContent>
      <TabsContent value="stats" className="pt-4">
        <Panel>Serve, return and rally numbers, each with its receipt.</Panel>
      </TabsContent>
      <TabsContent value="matches" className="pt-4">
        <Panel>Every match Sam has played, most recent first.</Panel>
      </TabsContent>
    </Tabs>
  ),
}
