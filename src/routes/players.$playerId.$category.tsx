import { createFileRoute, Link, notFound } from "@tanstack/react-router"

import {
  CATEGORY_KEYS,
  categoryBlurb,
  categoryLabel,
} from "@/features/dashboard/lib/categories"
import { CategoryContent } from "@/features/dashboard/components/category/category-content"
import { FilterBar } from "@/features/dashboard/components/category/filter-bar"
import {
  insightSearch,
  searchToFilters,
} from "@/features/dashboard/lib/insight-filters"
import { Overline, PageTitle } from "@/components/typography"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"
import { playersQueryOptions, usePlayers } from "@/lib/api/get-players"

import type { CategoryKey } from "@/features/dashboard/lib/categories"

// Category detail (§5.1, §3.3): one shared template — breadcrumb, filter bar,
// then the per-category content — instantiated for all five categories. The
// content ends in the underlying-rallies table (or, for head-to-head, the
// results list), so every number drills to what produced it (§3.4).
//
// The header is the broadcast title graphic for a level-two board: the
// player's name as the tracked kicker over the category as the headline —
// this page is about the serve, and whose serve is the qualifier. The
// breadcrumb above it is the way back up.

export const Route = createFileRoute("/players/$playerId/$category")({
  validateSearch: (search) => insightSearch.parse(search),
  loader: async ({ context, params }) => {
    if (!CATEGORY_KEYS.includes(params.category as CategoryKey))
      throw notFound()
    await context.queryClient.ensureQueryData(playersQueryOptions())
  },
  component: CategoryDetailPage,
})

function CategoryDetailPage() {
  const { playerId, category } = Route.useParams()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const filters = searchToFilters(search)

  const players = usePlayers()
  const player = players.data?.find((p) => p.id === playerId)
  const key = category as CategoryKey

  if (!player) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/players/$playerId" params={{ playerId }}>
                {player.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{categoryLabel(key)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-1">
        <Overline as="h2" tone="primary">
          {player.name}
        </Overline>
        <PageTitle>{categoryLabel(key)}</PageTitle>
        <p className="text-sm text-muted-foreground">{categoryBlurb(key)}</p>
      </header>

      <FilterBar
        value={search}
        onChange={(next) => void navigate({ search: next })}
        excludePlayerId={playerId}
      />

      <CategoryContent category={key} playerId={playerId} filters={filters} />
    </main>
  )
}
