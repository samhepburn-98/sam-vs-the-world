import { CourtDiagram } from "@/components/court/court-diagram"
import { EmptyMedia } from "@/components/ui/empty"

// The shared empty-state graphic: the court motif, sized and toned the same
// way everywhere so no empty surface is bare and they all read as one family
// (§4.6, §10). Drop it in as the first child of an <EmptyHeader>.

export function CourtEmptyMedia() {
  return (
    <EmptyMedia variant="default">
      <CourtDiagram className="h-16 w-11 text-muted-foreground/60" />
    </EmptyMedia>
  )
}
