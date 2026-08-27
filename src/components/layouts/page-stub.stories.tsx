import { PageStub } from "@/components/layouts/page-stub"

import type { Meta, StoryObj } from "@storybook/react-vite"

// A whole page that admits there is nothing here: the court mark, a heading
// and one line, centred in the standard container. It owns its own <main>, so
// it is the page — not a block you drop into one, and not the thing to reach
// for when a section of a real page comes back empty (that is Empty, with
// CourtEmptyMedia). Today its one live use is the root route's not-found page;
// it is also the holding page to give a route whose real spec lands later.

const meta = {
  title: "Layouts/Page stub",
  component: PageStub,
  parameters: { layout: "fullscreen" },
  args: {
    title: "Not found",
    description: "That page doesn't exist — the rally went out of court.",
  },
} satisfies Meta<typeof PageStub>

export default meta
type Story = StoryObj<typeof meta>

// The 404, word for word as the root route's notFoundComponent renders it.
// For the holding-page job, the shape is identical — only the two strings
// change, so set them in Controls rather than reading a second story here.
export const Default: Story = {}
