import { CourtDiagram } from "@/components/court/court-diagram"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Placeholder for routes whose real page spec lands in a later phase.
export function PageStub({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <CourtDiagram className="text-muted-foreground h-16 w-11" />
          </EmptyMedia>
          <EmptyTitle className="font-heading">{title}</EmptyTitle>
          <EmptyDescription>{description}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </main>
  )
}
