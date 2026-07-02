import { createFileRoute } from "@tanstack/react-router"

import { CourtDiagram } from "@/components/court/court-diagram"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="container mx-auto max-w-5xl px-4">
      <section className="flex items-center gap-6 py-12">
        <CourtDiagram className="text-muted-foreground h-24 w-16 shrink-0" />
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Every rally, counted.
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Squash matches logged point by point — who won, how, and what it
            says about the way we play.
          </p>
        </div>
      </section>
      <Empty className="border-t">
        <EmptyHeader>
          <EmptyTitle className="font-heading">No matches logged yet</EmptyTitle>
          <EmptyDescription>
            The player roster and recent matches appear here once the first
            session is logged.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
