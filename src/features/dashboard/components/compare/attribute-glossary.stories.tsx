import { userEvent, within } from "storybook/test"

import { AttributeGlossaryDialog } from "@/features/dashboard/components/compare/attribute-glossary"

import { withRouter } from "#storybook/decorators"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The three-letter codes on the player card (SRV, RET, ATT…) are deliberately
// terse, so their spell-out lives one click away instead of crowding the
// page. Reach for it on any page showing a card or a radar — today it sits
// opposite the title in the /compare header, and only once two players are
// picked. It takes no props and reads the six definitions straight from
// ATTRIBUTE_META, so it cannot drift from them.

const meta = {
  title: "Dashboard/Attribute glossary",
  component: AttributeGlossaryDialog,
  decorators: [withRouter],
} satisfies Meta<typeof AttributeGlossaryDialog>

export default meta
type Story = StoryObj<typeof meta>

// At rest it is one quiet ghost button — small enough to sit next to a card
// without competing with it.
export const Default: Story = {}

// Open: the six attributes in two columns, a note that a dash means the
// sample is too thin, and a hand-off to the traits page for the class line.
export const Opened: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole("button", { name: "What do these mean?" })
    )
  },
}
