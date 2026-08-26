import { Overline, PageTitle, SectionTitle } from "@/components/typography"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The heading voice of the app: every page renders its titles through these
// three primitives, so this story is the single place to see (and change)
// how the app speaks.

const meta = {
  title: "Typography/Headings",
  component: PageTitle,
} satisfies Meta<typeof PageTitle>

export default meta
type Story = StoryObj<typeof meta>

export const Voice: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Overline>Overline label</Overline>
        <PageTitle>Page title</PageTitle>
      </div>
      <SectionTitle>Section title</SectionTitle>
      <div className="flex flex-col gap-1">
        <Overline tone="primary">Primary overline</Overline>
        <p className="text-sm text-muted-foreground">
          Body copy stays on plain Tailwind utilities; only the heading voice is
          componentised.
        </p>
      </div>
    </div>
  ),
}

export const PageTitleOnly: Story = {
  args: { children: "Sam vs the world" },
}
