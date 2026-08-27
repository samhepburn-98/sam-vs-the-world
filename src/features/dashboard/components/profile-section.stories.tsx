import { NarrativeInsight } from "@/features/dashboard/components/narrative-insight"
import {
  PROFILE_PANEL,
  ProfileSection,
} from "@/features/dashboard/components/profile-section"
import { StatBarRow } from "@/features/dashboard/components/stat-bar-row"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One titled band of a profile tab — overline heading, a lede that reads the
// section's own data, then whatever it draws. Reach for it for every band of
// the Summary and Matches tabs so each opens the same way; `PROFILE_PANEL` is
// the matching card shell for the sections that draw inside a panel.

const ERRORS = (
  <div className="w-full">
    <StatBarRow label="Tin" pct={33} value="20 of 60" tone="loss" />
    <StatBarRow label="Out (top)" pct={17} value="10 of 60" tone="loss" />
    <StatBarRow label="Not up" pct={17} value="10 of 60" tone="loss" />
  </div>
)

const meta = {
  title: "Dashboard/Profile section",
  component: ProfileSection,
  args: {
    title: "Where the errors die",
    lede: "Every error given away, drawn where it died. 33% of them went into the tin.",
    children: (
      <div className={`${PROFILE_PANEL} grid gap-4 lg:grid-cols-[1.4fr_1fr]`}>
        {ERRORS}
        <NarrativeInsight
          insight={{
            eyebrow: "The biggest leak",
            title: "The tin is where the points go.",
            body: "20 of 60 located errors died in the tin — the single cheapest habit to fix.",
            highlight: true,
          }}
        />
      </div>
    ),
  },
  render: (args) => (
    <div className="w-full max-w-3xl">
      <ProfileSection {...args} />
    </div>
  ),
} satisfies Meta<typeof ProfileSection>

export default meta
type Story = StoryObj<typeof meta>

// The common case: a heading, a lede that reads this section's own numbers,
// and contents on the shared panel shell.
export const Section: Story = {}

// A section that draws straight onto the page. The panel is opt-in: use it
// when the contents need a surface of their own, skip it when they already
// carry one (a match list, a grid of tiles) so cards never nest inside cards.
export const WithoutThePanel: Story = {
  name: "Without the panel",
  args: {
    title: "At a glance",
    lede: "The three rates that carry a game, each measured from real rallies — never invented ratings.",
    children: (
      <div className="w-full max-w-md">
        <StatBarRow label="Serve won" pct={58} value="58 of 100" />
        <StatBarRow label="Return won" pct={47} value="47 of 100" />
        <StatBarRow label="Extended rallies" pct={54} value="65 of 120" />
      </div>
    ),
  },
}

// How a tab actually reads: bands stacked with generous air, each announcing
// itself the same way, so the eye finds the headings before the numbers.
export const TabRhythm: Story = {
  name: "Tab rhythm",
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-10">
      <ProfileSection
        title="The shape of the game"
        lede="Every rate measured from real rallies — never invented ratings. Strongest at serve, with return the clearest area to improve."
      >
        <div className={`${PROFILE_PANEL} grid gap-4 lg:grid-cols-[1.2fr_1fr]`}>
          <div className="w-full">
            <StatBarRow label="Serve won" pct={58} value="58 of 100" />
            <StatBarRow label="Return won" pct={47} value="47 of 100" />
            <StatBarRow label="Short rallies" pct={44} value="35 of 80" />
          </div>
          <NarrativeInsight
            insight={{
              eyebrow: "Strength",
              title: "The serve is the weapon.",
              body: "58% of points won behind your own serve — 58 of 100 serve rallies. The point starts on your terms.",
              highlight: true,
            }}
          />
        </div>
      </ProfileSection>
      <ProfileSection
        title="Where the errors die"
        lede="Every error given away, drawn where it died. 33% of them went into the tin."
      >
        <div className={`${PROFILE_PANEL} grid gap-4 lg:grid-cols-[1.4fr_1fr]`}>
          {ERRORS}
          <NarrativeInsight
            insight={{
              eyebrow: "The ledger",
              title: "They have to earn it.",
              body: "33 of 55 tagged errors were forced by the opponent's shot; only 22 were gifts. The errors you give are mostly paid for.",
            }}
          />
        </div>
      </ProfileSection>
    </div>
  ),
}
