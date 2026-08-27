import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The picker for "one of a named list": the opponent filter on a player
// page, the two player slots in match setup. The value is an id, the label
// is a person. For a short set of fixed values — ball, outcome, side —
// reach for a toggle group instead; it shows every option without a click.

const meta = {
  title: "Primitives/Select",
  component: Select,
  args: { defaultValue: "all" },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectTrigger className="w-48" aria-label="Opponent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All opponents</SelectItem>
        <SelectItem value={IDS.alex}>vs Alex</SelectItem>
        <SelectItem value={IDS.ormond}>vs Ormond</SelectItem>
      </SelectContent>
    </Select>
  ),
}

// Nothing chosen yet. The trigger falls back to the placeholder, which the
// muted `data-placeholder` styling marks as "not an answer" — worth using
// wherever an empty filter would otherwise read as a real selection.
export const Placeholder: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-48" aria-label="Opponent">
        <SelectValue placeholder="Pick an opponent" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={IDS.alex}>Alex</SelectItem>
        <SelectItem value={IDS.ormond}>Ormond</SelectItem>
      </SelectContent>
    </Select>
  ),
}

// Open on load, so the catalogue shows the menu rather than the button: the
// tick marks the current value, and a label plus separator split "everyone"
// off from the named opponents.
export const Open: Story = {
  render: () => (
    <Select defaultOpen defaultValue={IDS.alex}>
      <SelectTrigger className="w-48" aria-label="Opponent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All opponents</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Opponents</SelectLabel>
          <SelectItem value={IDS.alex}>vs Alex</SelectItem>
          <SelectItem value={IDS.ormond}>vs Ormond</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

// Locked: the answer is fixed by the page it sits on — a head-to-head view
// where the opponent is the whole point and cannot be changed away.
export const Disabled: Story = {
  render: () => (
    <Select disabled defaultValue={IDS.alex}>
      <SelectTrigger className="w-48" aria-label="Opponent">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={IDS.alex}>vs Alex</SelectItem>
      </SelectContent>
    </Select>
  ),
}
