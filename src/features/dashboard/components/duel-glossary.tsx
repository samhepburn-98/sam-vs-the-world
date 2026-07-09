import { ATTRIBUTE_META } from "@/features/dashboard/lib/player-attributes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// The stats glossary: the six attribute codes are terse by
// design, so this lives behind a dialog — a quiet "what do these mean?"
// trigger opens the full spell-out. Single-sourced from ATTRIBUTE_META.

export function DuelGlossaryDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          What do these mean?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">
            What the stats mean
          </DialogTitle>
          <DialogDescription>
            Every attribute is a measured win rate from your logged rallies. A
            dash means there aren&rsquo;t enough games to be fair yet.
          </DialogDescription>
        </DialogHeader>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {ATTRIBUTE_META.map((g) => (
            <div key={g.key} className="flex gap-3">
              <dt className="text-muted-foreground w-10 shrink-0 pt-0.5 text-xs font-semibold tracking-[0.06em]">
                {g.code}
              </dt>
              <dd>
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-muted-foreground text-sm">{g.detail}</p>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
