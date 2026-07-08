// The one-sentence match narrative (§5.2): buildMatchStory picks the biggest
// true headline from the numbers; this just gives it a stage. Renders
// nothing when the data had nothing confident to say.

export function MatchStory({ story }: { story: string | null }) {
  if (!story) return null
  return (
    <aside
      aria-label="Match story"
      className="rounded-r-2xl border-l-4 border-primary bg-card p-5 ring-1 ring-foreground/10"
    >
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        The story
      </p>
      <p className="font-heading text-lg leading-snug">{story}</p>
    </aside>
  )
}
