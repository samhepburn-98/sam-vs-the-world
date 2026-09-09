# Database

How the squash data is modelled, and the machinery that keeps it honest. For the _why_ behind each
choice, see [decisions.md](decisions.md). The plan of record is [PROJECT_PLAN.md](../PROJECT_PLAN.md) §7.

## The core idea

**Rallies are the source of truth.** One row per point, in order. Everything interesting — the
running score, who won a game, who won a match, every stat on the dashboard — is _derived_ from the
ordered sequence of rally winners, never stored. Editing or deleting any rally automatically
recomputes everything downstream; there are no cached numbers to drift out of sync.

```
players ──< matches >── players        a match links two players
              │
              └──< games ──< rallies   a match has games; a game has rallies
```

- **match** — a session of games between two players on a date. Carries the **house rules** — the
  per-match rule parameters (nothing about how you play is baked into the app): `format` (NULL =
  casual, or best-of any odd 1–9) · `target_score` (default 11) · `tiebreak` hint
  (`win_by_2`/`sudden_death`) · `serves_per_point` (1 or 2, default 2) · `let_resets_serve`
  (logger hint, default false) · `ball_type` — plus venue and notes. Defaults are Sam's rules, so
  the common case configures nothing.
- **game** — one race to the target. Just groups and orders rallies; its winner and final score are
  derived, not stored.
- **rally** — one point. The atomic unit.
- **player** — name, `handedness`, `avatar_url` (`20260709210000`: a public-read `avatars` bucket,
  one object per player, server-capped at 2 MiB and image-only — the client downscales well under
  that, the limits are the backstop) and `is_protagonist` (`20260826120000`: the one first-person
  player the "vs the World" framing belongs to. **Display-only** — the home screen features them and
  ordering prefers them; no stat treats them differently. Exactly one by convention, not by
  constraint).

Deleting a match cascades to its games and rallies. Player rows are delete-protected while
referenced (`on delete restrict`).

## The `rallies` table (the heart)

| column                    | meaning                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `game_id`, `rally_number` | position in the game — drives every order-dependent stat. Unique per game (deferrable, so a missed rally can be inserted mid-game inside one transaction)            |
| `server_id`               | who served — **stored fact, never derived** (real-world serving can deviate from the rules)                                                                          |
| `serve_side`              | which service box (`left`/`right`)                                                                                                                                   |
| `serve_number`            | 1 or 2 — we play two serves; a point played on serve 2 means the first serve faulted                                                                                 |
| `winner_id`               | who won the point. **NULL only for lets**                                                                                                                            |
| `end_reason`              | how the point ended (see enums below)                                                                                                                                |
| `error_detail`            | which kind of error, when `end_reason` is `error`/`serve_fault`                                                                                                      |
| `forced`                  | forced vs unforced — only on `error`; NULL = untagged                                                                                                                |
| `winning_shot`            | the winner's decisive shot — their clean winner, or the shot that forced the error; only on `winner`/forced `error`; optional forever                                |
| `losing_shot`             | the loser's final failed shot; only on `error`; optional forever                                                                                                     |
| `shot_count`              | total shots **including the serve** (double fault = 0); NULL = untagged. A `winner` with `shot_count = 1` where the server won **is** an ace — derived, never stored |

## Enums

**`end_reason`** — every stat keys off this:

| value         | meaning                                                        | winner is                     |
| ------------- | -------------------------------------------------------------- | ----------------------------- |
| `winner`      | a clean winning shot                                           | the striker                   |
| `error`       | the loser made a mistake (see `error_detail`)                  | the non-erring player         |
| `stroke`      | interference call, point awarded                               | the obstructed player         |
| `let`         | interference call, point replayed — no winner, no score change | NULL                          |
| `serve_fault` | second-serve fault = double fault                              | the receiver (CHECK-enforced) |

**`error_detail`** — the error taxonomy (house definitions):

| value                   | meaning                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tin`                   | hit the tin (the metal bar / low line on the front wall)                                                                                                                                                                        |
| `out_top`               | over the out line on the front wall (overhit high)                                                                                                                                                                              |
| `out_side` / `out_back` | out off the side wall / over the back                                                                                                                                                                                           |
| `not_up`                | hit the ball but it didn't reach the front wall                                                                                                                                                                                 |
| ~~`double_bounce`~~     | **retired** (`20260714120000`) — a ball the opponent never reached is a `winner`; one they reached too late is the textbook `not_up`. Legacy rows were folded into `not_up`; the value stays in the enum but a CHECK rejects it |

Also: `serve_side` (`left`/`right`), `shot_type` (`drop`/`drive`/`boast` — kill/nick/volley/
lob/other retired, kept in the enum but rejected by CHECK; the type is shared by
`winning_shot` and `losing_shot`), `handedness`, `tiebreak`, `ball_type` (`blue`/`red`/`yellow`/`double_yellow` —
bounce ≈ difficulty: blue easiest, double yellow coldest/hardest).

**Retirement is always the same manoeuvre.** Postgres can't drop an enum value in place without
recreating the type and every dependent object, so a retired value is folded into its honest
replacement, kept in the enum, and rejected by a CHECK — which locks it out regardless of client.
`ace` (`20260706174523`, `20260710160000`), the retired `shot_type`s (`20260710120000`) and
`double_bounce` (`20260714120000`) all went this way.

## Integrity guards

The most likely data-entry bugs are _blocked by the database_, not policed by good intentions:

| guard                                                                                                                                                                         | protects against                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `let ⇔ winner IS NULL` (biconditional CHECK)                                                                                                                                  | a non-let rally silently missing its winner — which would corrupt every running score                            |
| **rule-aware serve validation** (trigger reads the match's `serves_per_point`): `serve_number ≤ serves_per_point`; two-serve matches require `serve_fault ⇒ serve_number = 2` | serve data that contradicts the match's own rules — while keeping official single-serve squash loggable          |
| `serve_fault ⇒ winner = receiver`                                                                                                                                             | mis-tagged winners poisoning serve stats and error attribution (holds under any serve rule, so it stays a CHECK) |
| `error_detail`/`forced`/`winning_shot`/`losing_shot` scope CHECKs                                                                                                             | detail fields on rally types they don't apply to                                                                 |
| trigger: rally's server & winner must be players of the match                                                                                                                 | orphaned stats from a stray UUID                                                                                 |
| trigger: match players **and `serves_per_point`** immutable once games exist                                                                                                  | silently orphaning rally mappings / invalidating logged serve data                                               |
| `player1 ≠ player2` · `format ∈ {3,5}` · positive counters                                                                                                                    | nonsense rows                                                                                                    |
| `updated_at` triggers on all tables                                                                                                                                           | edit auditability                                                                                                |

## Conventions (not in the schema, but load-bearing)

- **Error-maker = the player who is NOT `winner_id`** (for `error`/`serve_fault`). Strokes and lets
  are not errors.
- **Lets** occupy a `rally_number` (countable for let-frequency) but are excluded from score, serve
  and streak calculations.
- **Let/serve interaction is per-match** (`let_resets_serve`, default false: the replayed point keeps
  its `serve_number`). Lives only in the logger's suggested default — the DB stores what actually
  happened — so it never touches data.
- **Edits never cascade serve context.** The match already happened: editing a rally's winner
  corrects _what was recorded_, not what physically followed. Stored `server_id`/`serve_side` on
  later rallies stay as logged; only derived values recompute.
- **Every match is finished-as-logged.** There is no "in progress" state; resuming a half-logged
  match is just editing it (owner-only "Edit match").
- **First server is asked, never assumed** — match setup asks; each later game defaults to the
  previous game's winner as an editable suggestion.

## The derivation layer (views)

Four `security_invoker` views recompute everything live from rallies — the app reads these, not the
raw tables:

| view                | what it computes                                                                                                             | the trick                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rallies_scored`    | every rally + the running score _after_ it, plus derived `receiver_id` and page-level context (game_number, date, ball_type) | a windowed conditional `sum` per player: a **let contributes 0 to both**, so its row simply carries the prior score — no special-casing                                                                                                                                                                                                                                                                                                                                   |
| `game_results`      | each game's final score + winner + `is_undecided`                                                                            | **rule-agnostic**: winner = whoever leads at the last rally actually played. Win-by-2, sudden death, and casual play-on all just work, because the rules only decide _when you stop_, and that's encoded in which rallies exist                                                                                                                                                                                                                                           |
| `match_results`     | games won per player, match winner, and the **`outcome` verdict** (`p1`/`p2`/`draw`/`pending`) + `created_at`                | respects optional best-of `format` (clinch at `format/2 + 1`), plain majority for casual; only decided games count. `outcome` (`20260714150000`) states the verdict instead of leaving a NULL winner for each reader to interpret — a casual session level after ≥1 decided game **is** a draw, an unclinched best-of stays `pending`. `created_at` (`20260714110000`) gives "newest first" a total order, since `date` is a DATE and a whole evening's matches tie on it |
| `errors_attributed` | each `error`/`serve_fault` mapped to the player who made it                                                                  | error-maker = the non-winner (the §Conventions rule, baked in so queries never re-derive it)                                                                                                                                                                                                                                                                                                                                                                              |

## Access model (RLS)

**Public read, owner-only write** — enforced by the database, not the app:

- Every table has `select` policies for `anon` + `authenticated` (`using (true)`) — the public
  dashboard reads with the publishable key.
- All writes (`insert`/`update`/`delete`) require `is_owner()`: the caller's `auth.uid()` must be in
  the `app_admins` registry. `is_owner()` is `security definer` with an empty pinned `search_path`,
  wrapped in `(select …)` inside policies so Postgres evaluates it once per statement.
- This project auto-enables RLS on new `public` tables (Supabase's `rls_auto_enable` event trigger),
  so tables are locked from birth; the policies are what _open_ public reads and admit owner writes.
- Views are `security_invoker`, so they inherit these policies rather than bypassing them.
- One accepted advisor WARN: `is_owner()` stays executable by `authenticated` — required, since RLS
  policies evaluate it as the querying role; it reveals only "am I the admin?".

To grant the owner: create the auth user, then
`insert into public.app_admins (user_id) values ('<auth-uid>');`

## Migrations

| version                                    | contents                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `20260702190340_enums_and_tables`          | tables, enums, constraints, triggers                                                                                                                        |
| `20260702212145_views`                     | the four derived views                                                                                                                                      |
| `20260702212656_rls_policies`              | app_admins, is_owner(), public-read / owner-write policies                                                                                                  |
| `20260702212852_security_hardening`        | pinned function search_paths, RPC exposure revokes (advisor lints)                                                                                          |
| `20260702221549_house_rules`               | serves_per_point + let_resets_serve, format odd 1–9, rule-aware serve trigger                                                                               |
| `20260703143000_insert_rally_at`           | transactional mid-game insert (see below)                                                                                                                   |
| `20260703180000_insights_headline_h2h`     | 0004a: shared filter helpers, player_headline(s), h2h (+ companion) — see below                                                                             |
| `20260703200000_serve_stats_error_profile` | 0004b: serve_stats + error_profile (+ companions)                                                                                                           |
| `20260703220000_rally_lengths_momentum`    | 0004c: rally_lengths + momentum (+ companions)                                                                                                              |
| `20260706174523_derive_aces`               | `ace` stops being an end reason: a 1-shot `winner` by the server **is** an ace. Existing rows reclassified                                                  |
| `20260709210000_avatars`                   | `avatars` storage bucket (public read, owner write, 2 MiB image-only cap) + `players.avatar_url`                                                            |
| `20260710120000_shot_types`                | `shot_type` narrowed to `drive`/`boast`/`drop` — kill remapped to drive, nick/volley/lob/other nulled, the rest CHECK-rejected                              |
| `20260710160000_last_shot_derived_ace`     | the ace retirement completed: `shot_count` pinned to 1 on converted rows, the value CHECK-rejected for new ones                                             |
| `20260710200000_decisive_shots`            | one shot column per meaning — `winning_shot` / `losing_shot` replace the polymorphic `shot_type`, each with its own scope CHECK                             |
| `20260710210000_decisive_shots_rpc`        | the `decisive_shots` insight over those columns                                                                                                             |
| `20260714110000_match_results_created_at`  | `match_results.created_at`, so "newest first" has a total order (`date` is a DATE and ties)                                                                 |
| `20260714120000_retire_double_bounce`      | `double_bounce` folded into `not_up` and CHECK-rejected — it was still counted in `errors_total` yet invisible in every breakdown                           |
| `20260714150000_match_outcome`             | `match_results.outcome` (`p1`/`p2`/`draw`/`pending`) — draws become first-class instead of a NULL winner each reader interpreted differently                |
| `20260714151000_h2h_outcome`               | `h2h`'s match history passes `outcome` through. Split from the view migration so the derivation tests can load the view without `filtered_*`                |
| `20260825120000_trait_matrix`              | signature trait v2: the 3×3 tempo×agency matrix replaces the single rally-length differential, with ≥30 sample guards and the agency receipts on the return |
| `20260826120000_protagonist_flag`          | `players.is_protagonist` — display-only, no stat reads it                                                                                                   |
| `20260826150000_records`                   | the `records()` wall (six all-time records, one round trip, first-wins ordering)                                                                            |
| `20260827120000_create_match_with_game`    | transactional match + game 1 creation (see below)                                                                                                           |

### The two writes that need a transaction

**`insert_rally_at(...)`.** Inserting a missed rally at position _k_ means
shifting every later rally up by one **and** inserting, atomically — PostgREST
can't span statements, so this lives as a database function. The unique
constraint on `(game_id, rally_number)` is `DEFERRABLE` for exactly this: the
function defers it, renumbers, inserts, and the constraint re-checks at commit.
`SECURITY INVOKER`, so RLS decides who can write, same as any direct insert;
`/rpc` exposure is owner-only per the hardening rules. A constraint violation
anywhere aborts the whole thing — no half-applied renumber is possible.

**`create_match_with_game(...)`** (migration `20260827120000`) is the other:
starting a match inserts a `matches` row and its `games` row 1, and PostgREST
can't span those two statements either. They were once two client writes
ordered by the logger's write queue, which meant an abandoned match could
leave its game queued to fail against a row that never existed (audit §1.8).
Inside one function body they share the caller's transaction, so neither half
can land alone — no game without its match, and no match without a game 1 to
log into. `SECURITY INVOKER` and owner-only `/rpc` exposure, as above.

Everything else the app writes is a single-statement insert/update/delete and
goes through PostgREST directly.

### The insight RPCs (migration 0004a onward)

Every analytical stat is computed in Postgres — one function per insight,
all `SECURITY INVOKER`, read-only, and executable by `anon` (public read,
same reach as the views). They share three **set-returning filter helpers**
(`filtered_matches`, `filtered_games`, `filtered_rallies`) that apply the
cross-cutting filters — `opponent_id`, `ball_type`, `date_from/to` — from one
player's perspective. An aggregate RPC and its `*_rallies` drill-through
companion both read from the _same_ helper, so the rally table under a number
can never drift from the number above it.

| function                                            | returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `player_headline(player_id, …filters)`              | win rate inputs over **decided** games (`games_won` / `games_decided`), match record, last-10 game results (jsonb, newest first), signature trait (one of §3.2's nine tempo×agency matrix cells, null under the ≥30 sample guards) plus its agency receipts (`clean_finish_wins` / `points_won`)                                                                                                                                                                                                                                       |
| `players_headline()`                                | the batch variant — every player's headline (plus `name`/`handedness`) in one call for the home roster, unfiltered and name-ordered (§8.4: "no per-card N+1"). **No client caller since `e678ce8` (15 Jul 2026)**, when the roster became full player cards needing the six attribute payloads the headline doesn't carry; the client hook and its schema were deleted then, the function was not. `20260825120000_trait_matrix` has since recreated it with the trait columns, so it is maintained but unreached — see the note below |
| `h2h(p1, p2, …filters)`                             | the pair's game & match record from `p1`'s perspective + date-ascending match history (jsonb)                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `h2h_rallies(p1, p2, …filters)`                     | the rally rows behind those numbers (`rallies_scored` shape)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `serve_stats(player_id, …filters)`                  | every §3.3.2 pinned serve derivation as numerator/denominator counts. Lets excluded from every denominator; serve-number stats computed over `serves_per_point = 2` matches only                                                                                                                                                                                                                                                                                                                                                       |
| `serve_rallies(player_id, …filters)`                | the decided rallies the player served — serve_stats' outermost denominator                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `error_profile(player_id, …filters)`                | error counts (error-maker = non-winner over `error` + `serve_fault`), detail split, forced / unforced / **untagged** three-way (over `error` rows only — a serve_fault can never carry a forced tag), per-match trend (jsonb)                                                                                                                                                                                                                                                                                                          |
| `error_rallies(player_id, …filters)`                | the error rows behind those counts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `rally_lengths(player_id, …filters)`                | average + longest + the 1–3 / 4–8 / 9+ histogram buckets, each with a win count. Over decided rallies with `shot_count >= 1` — untagged (null) and 0-shot double faults excluded, so the buckets partition the average                                                                                                                                                                                                                                                                                                                 |
| `rally_length_rallies(player_id, …filters, bucket)` | the rallies in one bucket (`short`/`medium`/`long`, null = all)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `momentum(player_id, …filters, deficit)`            | comeback count (trailed by ≥ `deficit`, default 4, then won), longest within-game win streak (+ its game, lets excluded), phase win-share bands (leading score after each rally, boundaries `round(4·target/11)` / `round(8·target/11)`), and the comeback list (jsonb)                                                                                                                                                                                                                                                                |
| `comeback_rallies(player_id, …filters, deficit)`    | every rally of the comeback games — one momentum chart each                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `decisive_shots(player_id, …filters)`               | the shot that ended the rally, counted per type for both sides: `winning_*` (rallies won whose `winning_shot` is tagged — a clean winner, or the shot that forced the error) and `losing_*` (rallies lost whose `losing_shot` is tagged). Built on `filtered_rallies` like every other insight                                                                                                                                                                                                                                         |

One RPC sits outside the per-player family:

| function    | returns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `records()` | every all-time record as one uniform row — `biggest_win`, `longest_rally`, `best_streak`, `marathon_game`, `most_aces`, `most_lets` — so the whole wall is a single round trip. Takes no filters. First achiever holds a record until it is **strictly** beaten (every block orders `value desc, date asc, created_at asc`, then play order, so the tail is deterministic); a record with no qualifying data returns no row; `player_id` NULL means the record belongs to the match, not a player (both players own a marathon) |

> **`players_headline()` is stranded, not wrong.** It was built to §8.4's spec and used as specified
> until the July roster redesign; the reason it was dropped ("the card needs the full payloads it
> never carried") applied to a roster where _every_ entry was a full attribute card. It no longer
> describes the current design: only the featured player renders a full card, and the other rows show
> trait + win rate — precisely this function's payload. Either re-point the roster at it or drop the
> function; leaving it maintained-but-unreached is the one state that costs without paying.

The jsonb payloads are pinned by zod schemas in
`src/features/dashboard/schemas/insights.ts` (and `records.ts` alongside it)
— the generated DB type says `Json`, the schema turns it into a real type at
the query boundary or fails loudly. `records()` is read _tolerantly_: rows
whose `record_key` the running client doesn't recognise are dropped rather
than thrown, because a migration can land moments before the Worker deploy.
