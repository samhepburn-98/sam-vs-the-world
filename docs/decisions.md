# Decision log — database

The judgment calls behind the schema, and what each one buys or costs. Reference doc; the plan of
record is [PROJECT_PLAN.md](../PROJECT_PLAN.md).

## 1. Log at the rally level, one row per point

Final scores answer "who won." The *ordered sequence* of rallies answers everything else — comebacks,
who closes out games, streaks, error types, serve win rates. Anything depending on the order of
points needs the sequence; summary totals cannot reconstruct it. This is the project's core bet.

## 2. Derive, don't store

Running score, game winners, and match winners are computed by views over the rally sequence — never
stored in columns. Storing them would create a second source of truth that must be kept honest on
every edit; deriving makes edits self-heal by construction. The cost (recomputing on read) is nothing
at hobby volume. **Consequence:** editing any rally instantly corrects every downstream number.

## 3. The game winner is "whoever leads at the last rally played"

Deliberately rule-agnostic: the view doesn't know about 11 points or win-by-2. The rules only decide
*when you stop playing*, and that's already encoded in which rallies exist. This makes win-by-2 and
sudden-death both work with zero rule-specific code, and survives any future house-rule change.
`target_score`/`tiebreak` exist only as *logger hints* for suggesting "game over".

## 4. `server_id` is stored, never derived

Real-world serving can deviate from the official rotation (someone serves from the wrong box, or the
"wrong" player serves — nobody's refereeing). The database records what happened; the logger merely
*suggests* the rule-correct server/box, tappable to override. **Corollary:** edits never cascade serve
context — fixing rally 5's winner doesn't rewrite who actually served rally 6.

## 5. No "in progress" state — every match is finished-as-logged

Logging happens after the fact from footage, possibly across sittings. Rather than model
completeness, any match can be reopened and appended to (owner-only "Edit match"). Resume = edit.
One less state to think about, and the derived model doesn't care.

## 6. Lets are rows with `winner_id = NULL`

A let replays the point: no winner, no score change. Storing it (rather than skipping it) keeps
let-frequency countable and the rally numbering true to what happened. The let ⇔ null-winner CHECK is
biconditional, so the single most dangerous entry bug — a real rally saved without a winner, silently
shifting every score after it — is impossible.

## 7. Two-serve house rules are encoded as CHECKs

We play two serves. A point can therefore only *end* on a serve fault on the second serve
(`serve_fault ⇒ serve_number = 2`), an ace is by definition won by the server, and a double fault by
the receiver. These are single-row facts, so the DB enforces them; the logger auto-sets them so
they're never manual. First-serve faults are never rows — they exist implicitly as points played on
serve 2. **Lets don't reset serves** (house rule) — encoded only as the logger's default, so changing
the rule later has zero schema or data impact.

## 8. `shot_count` includes the serve; NULL means untagged

Ace = 1, double fault = 0, and any rally may be left untagged (NULL) — untagged rallies are excluded
from all rally-length stats rather than polluting them. Same philosophy for `forced` (only meaningful
on errors; NULL = untagged, reported as its own bucket, never assumed unforced).

## 9. Ball type lives on the match

Blue → double-yellow is effectively a difficulty scale (bounciness); a colder ball lengthens rallies
and shifts error rates, so "performance by ball" is a real insight. Stored per match because you pick
a ball for a session; if we ever swap balls mid-match it moves to `games` — consciously not paying
for that now.

## 10. Players are immutable on a match once games exist

Changing a match's players after rallies reference them would orphan every winner/server mapping in
the derived views — scores would silently become 0-0 with no error anywhere. A trigger forbids it;
fix wrong players by recreating the match before logging games.

## 11. UUIDs, smallints, and a deferrable uniqueness

UUID keys (client-generatable — the logger mints ids locally so optimistic writes retry
idempotently); smallint counters (squash never approaches the limits); `(game_id, rally_number)`
unique but *deferrable*, so "insert a missed rally at position k" can renumber inside one
transaction.

## 12. Public read, owner-only write (RLS)

The dashboard is public by design; only the owner can log or edit. Row Level Security is the real
lock — app-level auth guards are UX only. Lands in the RLS migration.
