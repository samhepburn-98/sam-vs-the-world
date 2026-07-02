import { useQueryClient } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useRef, useState } from "react"

import { LoggingShell } from "@/components/logger/logging-shell"
import { MatchSetup } from "@/components/logger/match-setup"
import { RecentMatches } from "@/components/logger/recent-matches"
import { Spinner } from "@/components/ui/spinner"
import { useCreatePlayer } from "@/lib/queries/create-player"
import { planCreateMatch } from "@/lib/queries/create-match"
import { useRecentMatches } from "@/lib/queries/get-recent-matches"
import { usePlayers } from "@/lib/queries/get-players"
import { classifySupabaseWriteError } from "@/lib/queue/supabase-errors"
import { WriteQueue } from "@/lib/queue/write-queue"

export const Route = createFileRoute("/entry")({
  // UX gate only — RLS is the real lock (§8.5)
  beforeLoad: ({ context }) => {
    if (!context.user) throw redirect({ to: "/login" })
  },
  component: EntryPage,
})

type Session = { matchId: string } | null

function EntryPage() {
  const queryClient = useQueryClient()
  const players = usePlayers()
  const recent = useRecentMatches()
  const createPlayer = useCreatePlayer()
  const [session, setSession] = useState<Session>(null)

  // One queue per logging session — every logger write flows through it (§8.3).
  const queueRef = useRef<WriteQueue | null>(null)
  queueRef.current ??= new WriteQueue({
    classify: classifySupabaseWriteError,
  })
  const queue = queueRef.current

  if (players.isPending || recent.isPending) {
    return (
      <main className="flex justify-center py-16">
        <Spinner />
      </main>
    )
  }
  if (players.isError || recent.isError) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-destructive text-sm">
          Couldn't load players and matches — check your connection and reload.
        </p>
      </main>
    )
  }

  if (session) {
    return (
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <LoggingShell
          matchId={session.matchId}
          players={players.data}
          onExit={() => {
            setSession(null)
            void queryClient.invalidateQueries({ queryKey: ["matches"] })
          }}
        />
      </main>
    )
  }

  return (
    <main className="container mx-auto flex max-w-2xl flex-col gap-10 px-4 py-10">
      <section>
        <h1 className="font-heading mb-6 text-2xl font-bold tracking-tight">
          New match
        </h1>
        <MatchSetup
          players={players.data}
          onCreatePlayer={(name) => createPlayer.mutateAsync({ name })}
          onStart={async (input) => {
            const plan = planCreateMatch(input)
            for (const op of plan.ops) queue.enqueue(op)
            await queue.flush()
            if (queue.state.status === "paused") {
              queue.discardFailed()
              return "Couldn't save the match — check your connection and try again."
            }
            void queryClient.invalidateQueries({ queryKey: ["matches"] })
            setSession({ matchId: plan.matchId })
            return null
          }}
        />
      </section>
      <section>
        <h2 className="font-heading mb-4 text-lg font-bold tracking-tight">
          Reopen a match
        </h2>
        <RecentMatches
          matches={recent.data}
          players={players.data}
          onOpen={(matchId) => setSession({ matchId })}
        />
      </section>
    </main>
  )
}
