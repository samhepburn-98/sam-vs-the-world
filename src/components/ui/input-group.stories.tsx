import { SearchIcon, XIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

import type { Meta, StoryObj } from "@storybook/react-vite"

// One bordered shell holding a control plus whatever sits against it — an
// icon, a unit, a button — so the focus ring is drawn once around the whole
// thing instead of round a naked input with furniture floating beside it.
// Addons align inline (left/right of the value) or block (a row above or
// below). The number stepper is this component with a button on each side.

const meta = {
  title: "Primitives/Input group",
  component: InputGroup,
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Search: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="inline-start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search matches" />
    </InputGroup>
  ),
}

export const Unit: Story = {
  name: "Unit suffix",
  render: () => (
    <InputGroup>
      <InputGroupInput
        type="number"
        defaultValue={11}
        aria-label="Points per game"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>Points</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
}

// Clicking an addon focuses the input — except on a button, which keeps its
// own click. That is what makes a trailing action safe to put inside the
// shell rather than beside it.
export const Action: Story = {
  name: "Inline action",
  render: () => (
    <InputGroup>
      <InputGroupInput defaultValue="Ormond" aria-label="Search matches" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label="Clear the search">
          <XIcon />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const Composer: Story = {
  name: "Notes composer",
  render: () => (
    <InputGroup>
      <InputGroupTextarea
        rows={3}
        aria-label="Match notes"
        placeholder="Anything worth remembering about the match."
      />
      <InputGroupAddon align="block-end" className="border-t">
        <InputGroupText>Saved with the match.</InputGroupText>
        <InputGroupButton variant="default" className="ml-auto">
          Save
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}
