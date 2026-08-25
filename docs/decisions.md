# Decision log

The judgment calls behind the schema and the app structure, and what each one buys or costs.
Reference doc; the plan of record is [PROJECT_PLAN.md](../PROJECT_PLAN.md). Decisions 1–13 are the
database; 14 onward, the frontend.

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

## 7. Serve rules are per-match, enforced by a rule-aware trigger

*(Amended by the house-rules migration — originally a two-serve CHECK.)* Serve rules are a match
parameter (`serves_per_point`, default 2 — our game). In a two-serve match a point can only *end* on
a second-serve fault; in an official single-serve match a first-serve fault ends the point. The
enforcement lives in the rally-validation trigger, which reads the match's rules — the original CHECK
made single-serve squash *unloggable*, which violated decision 13's principle. Ace ⇒ server wins and
fault ⇒ receiver wins hold under any serve rule, so they remain plain CHECKs. First-serve faults in
two-serve matches are never rows — they exist implicitly as points played on serve 2. Let/serve
interaction (`let_resets_serve`, default false) is a logger default only, never data.

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

## 13. House rules are match parameters, never baked-in assumptions

The guiding test: **if a rule changes what data can exist, it must be a parameter now; if it only
changes interpretation, it can be added later.** Rules live in three tiers — stored facts (rule-free),
derivation (rule-agnostic where it counts), logger behaviour (parameterized) — and only the data tier
is unrecoverable. Hence the per-match house-rule columns (format, target score, tiebreak, serves per
point, let-resets-serve, ball), defaulted to our rules so the common case configures nothing.
`serves_per_point` locks once games exist. Explicit non-goal: English hand-in/hand-out scoring
changes score *derivation* itself and isn't supported by the views — but the server is stored on
every rally, so a future view could derive it from the same data. Locked out of the views, not the
data.

## 14. Feature-based architecture with enforced boundaries

The frontend is organised by feature ([bulletproof-react](https://github.com/alan2207/bulletproof-react)),
not by file type, and the dependency direction (`shared → features → routes`) is enforced by an ESLint
rule rather than left to discipline. **What it buys:** each feature is a self-contained unit you can
read, change, or delete without hunting through `components/` and `lib/queries/` for its scattered
parts; the enforced boundary means the structure can't quietly erode as the app grows. **What it
costs:** anything two features share must move to `lib/`/`components/` rather than living with whoever
built it, which took a second pass to get right — the rally-entry engine and entity data-access turned
out to be shared, not logger-owned. Turning enforcement on is what surfaced that: it flagged the real
shared kernel instead of letting it hide as a cross-feature import. The one carve-out is `routes/`,
which stays put because TanStack Start generates its route tree from that path; route files are the
composition layer where features are allowed to meet. Full guide in
[architecture.md](architecture.md); lands in the restructure PR (#61).

## 15. Cross-engine visual effects are baked assets, not runtime filters

The roster cards' hover glow is a pre-rendered webp sprite (tinted, blurred frame silhouette)
faded in with `opacity`, not a transitioned `filter: drop-shadow`. The filter version failed in
ways that couldn't be styled around: animating a filter re-rasterizes every frame (the hover
jank), engines disagree about drop-shadow spread (Chromium wide, WebKit tight), and WebKit clips
the filter's paint region outright — the recurring Safari crop. **What it buys:** identical
rendering in every engine, hover animation that never leaves the compositor, and a bug class
retired rather than patched. **What it costs:** an offline generation step
(`scripts/generate-card-glow.mjs`) and a geometric coupling between the sprite's padding ratios
and the consumer's CSS insets, both documented in [card-glow.md](card-glow.md). The general rule
this sets: when a purely decorative effect depends on engine-divergent rendering, bake it into an
asset instead of fighting the divergence at runtime — this app is developed against Chromium
tooling but used in Safari.
