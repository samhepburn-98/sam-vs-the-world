import type { GameContext, RallyInput, ServeSide, Suggestion } from "./types"

// Next-rally suggestions. Everything here is a tappable default in the logger,
// never enforced — server context is stored fact, not derived truth (§7.2).

export function oppositeSide(side: ServeSide): ServeSide {
  return side === "left" ? "right" : "left"
}

// Defaults that are arbitrary but stable (a suggestion has to say something):
// a NEW server (first rally, or serve just changed hands) is suggested the
// left box; a RETAINED server alternates boxes, per the real serving rule.
const NEW_SERVER_SIDE: ServeSide = "left"

export function suggestNext(
  rallies: ReadonlyArray<RallyInput>,
  ctx: GameContext,
): Suggestion {
  const last = rallies.length > 0 ? rallies[rallies.length - 1] : undefined

  if (!last) {
    return {
      serverId: ctx.firstServerId,
      serveSide: NEW_SERVER_SIDE,
      serveNumber: 1,
    }
  }

  if (last.endReason === "let") {
    // Replay: same server, same box; serve number per the house rule.
    return {
      serverId: last.serverId,
      serveSide: last.serveSide,
      serveNumber: ctx.rules.letResetsServe ? 1 : last.serveNumber,
    }
  }

  // Decided rally: the winner serves next (PAR).
  const serverId = last.winnerId ?? last.serverId
  const retained = serverId === last.serverId
  return {
    serverId,
    serveSide: retained ? oppositeSide(last.serveSide) : NEW_SERVER_SIDE,
    serveNumber: 1,
  }
}

/** Each game's first server defaults to the previous game's winner (§7.2). */
export function suggestNextGameFirstServer(
  previousGameWinnerId: string | null,
  ctx: Pick<GameContext, "firstServerId">,
): string {
  return previousGameWinnerId ?? ctx.firstServerId
}
