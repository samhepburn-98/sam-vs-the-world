import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The pending marker for an action the reader just took — a submit, a save,
// a delete — and for a whole route that has nothing to hold a shape with yet,
// centred on the blank page. It inherits the current text colour and carries
// its own `role="status"`, so it needs no wrapper. Once a panel's shape is
// known, use a Skeleton instead: that holds the space, this only says
// "working".

const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The real use: swapped in beside the label while the form is submitting,
// with the button disabled so the action cannot be fired twice. The
// `data-icon="inline-start"` attribute is what tightens the button's leading
// padding around it.
export const InButton: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button disabled>
        <Spinner data-icon="inline-start" />
        Sign in
      </Button>
      <Button variant="destructive" size="sm" disabled>
        <Spinner data-icon="inline-start" />
        Delete
      </Button>
    </div>
  ),
}
