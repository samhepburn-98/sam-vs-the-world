import { createFileRoute, Link, notFound } from "@tanstack/react-router"

import {
  CATEGORY_KEYS,
  categoryLabel,
} from "@/features/dashboard/categories"
import { CategoryContent } from "@/features/dashboard/components/category-content"
import { FilterBar } from "@/features/dashboard/components/filter-bar"
import {
  insightSearch,
  searchToFilters,
} from "@/features/dashboard/utils/insight-filters"
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

import type { CategoryKey } from "@/features/dashboard/categories"

// Category detail (§5.1, §3.3): one shared template — breadcrumb, filter bar,
// then the per-category content — instantiated for all five categories. The
// content ends in the underlying-rallies table (or, for head-to-head, the
// results list), so every number drills to what produced it (§3.4).

export const Route = createFileRoute("/players/$playerId/$category")({
  validateSearch: (search) => insightSearch.parse(search),
  loader: async ({ context, params }) => {
    if (!CATEGORY_KEYS.includes(params.category as CategoryKey)) throw notFound()
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
              <Link to="/players/$playerId" params={{ playerId }} search={search}>
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

      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {player.name} · {categoryLabel(key)}
        </h1>
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
