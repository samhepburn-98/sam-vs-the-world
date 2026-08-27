import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "@tanstack/react-router"

import { withRouter } from "#storybook/decorators"
import { IDS } from "#storybook/fixtures"

import type { Meta, StoryObj } from "@storybook/react-vite"

// The one-line trail above a page title, for pages reached by drilling in: a
// player's category page, a single match. The last crumb is a BreadcrumbPage,
// not a link — it is where the reader already is. Links go through `asChild`
// so the router's Link keeps its own behaviour.

const meta = {
  title: "Primitives/Breadcrumb",
  component: Breadcrumb,
  decorators: [withRouter],
} satisfies Meta<typeof Breadcrumb>

export default meta
type Story = StoryObj<typeof meta>

// The category page trail: back to the player, then the category in view.
export const Default: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/players/$playerId" params={{ playerId: IDS.sam }}>
              Sam
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Serve</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}

// Nothing in the app is this deep yet, but when a trail outgrows a phone the
// middle collapses to an ellipsis and the two ends survive — where you came
// from, and where you are.
export const Collapsed: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/matches" search={{ page: 1 }}>
              Matches
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Sam vs Alex</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
}
