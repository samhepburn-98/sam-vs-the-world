# Database

How the squash data is modelled, and the machinery that keeps it honest. For the *why* behind each
choice, see [decisions.md](decisions.md). The plan of record is [PROJECT_PLAN.md](../PROJECT_PLAN.md) §7.

## The core idea

**Rallies are the source of truth.** One row per point, in order. Everything interesting — the
running score, who won a game, who won a match, every stat on the dashboard — is *derived* from the
ordered sequence of rally winners, never stored. Editing or deleting any rally automatically
recomputes everything downstream; there are no cached numbers to drift out of sync.

```
players ──< matches >── players        a match links two players
              │
              └──< games ──< rallies   a match has games; a game has rallies
```

- **match** — a session of games between two players on a date. A best-of format is *optional*
  (`format` = 3/5, or NULL for a casual session). Carries the house-rule context: `target_score`
  (default 11), `tiebreak` hint (`win_by_2`/`sudden_death`), `ball_type`, venue, notes.
- **game** — one race to the target. Just groups and orders rallies; its winner and final score are
  derived, not stored.
- **rally** — one point. The atomic unit.

Deleting a match cascades to its games and rallies. Player rows are delete-protected while
referenced (`on delete restrict`).

## The `rallies` table (the heart)

| column | meaning |
|---|---|
| `game_id`, `rally_number` | position in the game — drives every order-dependent stat. Unique per game (deferrable, so a missed rally can be inserted mid-game inside one transaction) |
| `server_id` | who served — **stored fact, never derived** (real-world serving can deviate from the rules) |
| `serve_side` | which service box (`left`/`right`) |
| `serve_number` | 1 or 2 — we play two serves; a point played on serve 2 means the first serve faulted |
| `winner_id` | who won the point. **NULL only for lets** |
| `end_reason` | how the point ended (see enums below) |
| `error_detail` | which kind of error, when `end_reason` is `error`/`serve_fault` |
| `forced` | forced vs unforced — only on `error`; NULL = untagged |
| `shot_type` | what shot won it — only on `winner`/`ace`; optional forever |
| `shot_count` | total shots **including the serve** (ace = 1, double fault = 0); NULL = untagged |

## Enums

**`end_reason`** — every stat keys off this:

| value | meaning | winner is |
|---|---|---|
| `winner` | a clean winning shot | the striker |
| `error` | the loser made a mistake (see `error_detail`) | the non-erring player |
| `stroke` | interference call, point awarded | the obstructed player |
| `let` | interference call, point replayed — no winner, no score change | NULL |
| `ace` | unreturnable serve | the server (CHECK-enforced) |
| `serve_fault` | second-serve fault = double fault | the receiver (CHECK-enforced) |

**`error_detail`** — the error taxonomy (house definitions):

| value | meaning |
|---|---|
| `tin` | hit the tin (the metal bar / low line on the front wall) |
| `out_top` | over the out line on the front wall (overhit high) |
| `out_side` / `out_back` | out off the side wall / over the back |
| `not_up` | hit the ball but it didn't reach the front wall |
| `double_bounce` | didn't get to the ball — it bounced twice |

Also: `serve_side` (`left`/`right`), `shot_type` (`drop`/`drive`/`kill`/`nick`/`boast`/`volley`/
`lob`/`other`), `handedness`, `tiebreak`, `ball_type` (`blue`/`red`/`yellow`/`double_yellow` —
bounce ≈ difficulty: blue easiest, double yellow coldest/hardest).

## Integrity guards

The most likely data-entry bugs are *blocked by the database*, not policed by good intentions:

| guard | protects against |
|---|---|
| `let ⇔ winner IS NULL` (biconditional CHECK) | a non-let rally silently missing its winner — which would corrupt every running score |
| `serve_fault ⇒ serve_number = 2` | recording a point as ending on a first-serve fault (impossible under two serves) |
| `ace ⇒ winner = server` · `serve_fault ⇒ winner = receiver` | mis-tagged winners poisoning serve stats and error attribution |
| `error_detail`/`forced`/`shot_type` scope CHECKs | detail fields on rally types they don't apply to |
| trigger: rally's server & winner must be players of the match | orphaned stats from a stray UUID |
| trigger: match players immutable once games exist | silently orphaning every rally's winner/server mapping |
| `player1 ≠ player2` · `format ∈ {3,5}` · positive counters | nonsense rows |
| `updated_at` triggers on all tables | edit auditability |

## Conventions (not in the schema, but load-bearing)

- **Error-maker = the player who is NOT `winner_id`** (for `error`/`serve_fault`). Strokes and lets
  are not errors.
- **Lets** occupy a `rally_number` (countable for let-frequency) but are excluded from score, serve
  and streak calculations.
- **Lets don't reset serves** (house rule): the replayed point keeps its `serve_number`. This lives
  only in the logger's suggested default — the DB stores what actually happened — so a future rule
  change is a one-line default change with zero data impact.
- **Edits never cascade serve context.** The match already happened: editing a rally's winner
  corrects *what was recorded*, not what physically followed. Stored `server_id`/`serve_side` on
  later rallies stay as logged; only derived values recompute.
- **Every match is finished-as-logged.** There is no "in progress" state; resuming a half-logged
  match is just editing it (owner-only "Edit match").
- **First server is asked, never assumed** — match setup asks; each later game defaults to the
  previous game's winner as an editable suggestion.

## What's derived (coming in the views migration)

`rallies_scored` (running score per rally, lets carried), `game_results` (winner = whoever leads at
the last rally actually played — deliberately rule-agnostic, so win-by-2 and sudden-death both just
work), `match_results` (respects optional best-of format), `errors_attributed` (errors mapped to the
player who made them). All `security_invoker`, all recomputed live from rallies.

## Migrations

| version | contents |
|---|---|
| `20260702190340_enums_and_tables` | this document's schema |
| *(planned)* views · RLS policies · insight RPCs | see PROJECT_PLAN.md §7.3/§8.4 |
