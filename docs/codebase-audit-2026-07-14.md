# Codebase audit — 14 July 2026

> **Status: a dated snapshot, mostly actioned. Not current guidance.**
>
> This is what the codebase looked like on 14 July 2026. Most of it has since been
> fixed, so read it as a record of what was found and what was done — not as a to-do
> list. The per-finding table is in [§ Status](#status) below; **§1.7 and §1.8 are the
> P0-adjacent items still genuinely open.**
>
> **§6 was not just incomplete — its reasoning was wrong, and it is worth reading
> before trusting a "zero importers" verdict anywhere.** It listed `insight-card.tsx`
> as a deletable dead file and, four lines later, cleared `category-content.tsx` as
> alive _"via `players.$playerId.$category`"_ — the route that file held the only link
> to. Both halves came from treating "a route renders it" as reachability. A route
> nothing links to is reachable only by typing a URL, and taking the advice would have
> stranded roughly 1,900 lines and five tested RPCs behind one.
>
> That chain has since been wired back up: the category tiles are on the profile, the
> five pages have had their Broadcast pass, and `get-h2h-rallies.ts` — the other file
> this section called dead — turned out to be the unbuilt half of the compare
> drill-through rather than a leftover, and now has a caller. §6 carries the full
> correction and the check to run instead.
>
> Everything not in the status table was not re-checked; assume it still needs
> verifying before you act on it.

**Method.** Two tracks, as requested: the repo's `/code-review` at high effort pointed at the data layer (8 finder angles → dedup → one adversarial verifier per candidate), plus a manual sweep by four dedicated audit agents (dead code & organisation, RPC/fetching conventions, tests, UI patterns) and mechanical checks run directly. Every correctness claim below carries a verdict from an independent verification pass: **CONFIRMED** (verifier reproduced the reasoning end-to-end from the code), **PLAUSIBLE** (real but scope-narrowed), or it was **refuted** and moved to §2 so the same false lead doesn't get chased twice.

**Reading order.** §1 is what's actually wrong. §2 is what looked wrong but isn't. §3–§10 are the sweep: efficiency, conventions, duplication, dead code, organisation, UI, tests, product gaps. §11 is the priority shortlist.

---

## Status

Fix status re-checked **27 Aug 2026**. A row says fixed or open only where the named code path was actually looked at; **not re-checked** means nobody has confirmed it since July.

| §            | Defect                                                | Status                                                                                                                                                                                                                        |
| ------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0            | Prettier drift, 171 files                             | ✅ Fixed — pinned, and `pnpm check` is a CI gate on a clean tree                                                                                                                                                              |
| 1.1          | Nothing invalidates `["insights"]` / `["home"]`       | ✅ Fixed — all ten mutations + logger exit invalidate the derived families                                                                                                                                                    |
| 1.2          | Match detail recomputes the match winner              | ✅ Fixed — the match-level verdict is the view's                                                                                                                                                                              |
| 1.3          | `errorProfile` schema strips `double_bounce`          | ✅ Resolved, differently — the value was retired at the database (`20260714120000_retire_double_bounce.sql` backfills it away and adds a CHECK), so the schema omitting it is now correct                                     |
| 1.4          | New-match flow hangs on sustained transient errors    | ✅ Fixed — retries capped in `WriteQueue` (`maxAttempts`), covered by tests                                                                                                                                                   |
| 1.5          | Home recent results ordering is nondeterministic      | ✅ Fixed — orders by `created_at`                                                                                                                                                                                             |
| 1.6          | Null `match_winner_id` renders five different ways    | ✅ Fixed — shared `matchOutcome`, "Drawn" across surfaces                                                                                                                                                                     |
| 1.7          | Logger in-play banner contradicts read surfaces       | ❌ Open — `matchWinnerName` still format-gated (`logging-shell.tsx:252`)                                                                                                                                                      |
| 1.8          | `discardFailed()` leaves the dependent create-game op | ❌ Open — **and now more likely to fire**, see the note there                                                                                                                                                                 |
| 6            | Dead code                                             | ◐ Partly — **and the section's reasoning was wrong**. Three of the five "deletable" files were a feature with no way in, not dead code. Corrected in place; one genuinely dead file (`profile-stat-strip.tsx`) has since gone |
| 8            | Compare panel's match rows don't link                 | ✅ Fixed — the rows are links, and the record drills on to the rallies beneath them                                                                                                                                           |
| 8            | Three section/panel primitives                        | ◐ Half — `category-content` and `h2h-panel` consolidated onto `ProfileSection`/`PROFILE_PANEL`; `profile-stats-tab`'s local shell is still open                                                                               |
| 2–5, 7, 9–11 | The rest of the sweep                                 | ⚠️ Not re-checked, except where a note is dated in the section itself                                                                                                                                                         |

---

## 0. Mechanical checks

| Check                   | 14 Jul 2026                                                 | 27 Aug 2026                        |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------- |
| `pnpm typecheck`        | ✅ clean                                                    | ✅ clean                           |
| `pnpm lint` (eslint)    | ✅ clean                                                    | ✅ clean                           |
| `pnpm test` (vitest)    | ✅ 309 tests, 42 files                                      | ✅ 344 passed, 2 skipped, 45 files |
| `pnpm check` (prettier) | ❌ **fails on 171 files**                                   | ✅ clean                           |
| Dependencies            | Patch-level drift only; no unused deps found in spot-checks | Not re-checked                     |

- ~~**Prettier drift (171 files).**~~ **Fixed.** `prettier` sits at 3.9.4, `pnpm check` is green, and it gates in CI.
- **Dependency majors available, not urgent:** eslint 10, typescript 7, jsdom 29, `@types/node` 26. Worth a deliberate upgrade pass, not a fire. recharts 3.8.0 → 3.9.2 is a minor worth taking (bug fixes).
- Hygiene: `dist/` and `test-results/` are properly gitignored.

---

## 1. Confirmed defects (code review, ranked)

### 1.1 No mutation ever invalidates `["insights"]` or `["home"]` — every derived stat goes stale after an edit · **CONFIRMED**

The single biggest correctness issue in the app. All 13 insight queries (serve stats, error profile, rally lengths, momentum, decisive shots, player/players headline, h2h, and the five drill-through rally queries) are keyed `["insights", …]`, and the home counts are keyed `["home", "counts"]`. **No code path anywhere invalidates either family.** Verified sub-claims:

- `insert-rally-at.ts:34`, `update-rally.ts:58`, `delete-rally.ts:45`, `update-game.ts:21`, `delete-game.ts:47`, `update-match.ts:33`, `delete-match.ts:15` — all invalidate exactly `["manage"]` + `["matches"]`, never `["insights"]`.
- `create-player.ts:27`, `update-player.ts:34`, `delete-player.ts:16` — never touch `["insights"]` (the roster headline embeds player names) nor `["matches"]` (match lists resolve names too).
- `src/routes/entry.tsx:67` — logger exit invalidates only `["matches"]` after a whole session of rally writes; the write queue itself performs zero invalidations.
- `["home","counts"]` is invalidated by nothing.

Severity context: `src/router.tsx` sets `staleTime: 30_000`, which makes this **worse** than TanStack defaults — within 30s of an edit, even navigating away and back shows the stale numbers, and a mounted dashboard never refreshes on its own. Freshness of every insight surface currently depends entirely on the 30s timer plus a remount/refocus, never on the writes themselves.

**Fix.** One shared helper (e.g. `invalidateDerived(queryClient)` invalidating `["insights"]`, `["matches"]`, `["home"]`, `["manage"]`) called from every mutation's `onSuccess` and from logger exit. Player mutations additionally need `["matches"]`.

### 1.2 Match detail page computes its own match winner and gets it wrong — `matches.$matchId.tsx:128` · **CONFIRMED**

The detail route derives the winner by raw game-count majority (`gamesWonP1 > gamesWonP2`), ignoring the best-of clinch threshold that both the `match_results` view (`format/2 + 1`) and `tallyMatch` enforce. It is the only surface in the app that recomputes the match winner instead of reading the view (its per-game derivation is correct; the bug is match-level only).

Reachable failure, verified end-to-end: a best-of-5 at games 2–1 (mid-log or abandoned) appears in the matches list with **no winner** (view says null — nobody clinched), but clicking through shows the leader's name crowned in primary as the winner, with the "Casual session." note suppressed. Same match, two contradictory verdicts, one click apart. The mirror case (4 decided games in a best-of-3 at 2–2 → page says "Casual session.", view names a winner) is reachable via manage edits or a post-hoc format change.

**Fix.** Delete the inline majority logic; use `tallyMatch` (already imported by the logger) or read `match_results.match_winner_id`.

### 1.3 `errorProfile` schema silently strips the RPC's `double_bounce` column — inconsistent error totals · **CONFIRMED**

The live `error_profile` RPC (20260703200000, never redefined since) returns a `double_bounce` count. The client schema (`src/features/dashboard/schemas/insights.ts`) omits the key, and zod's default object parsing strips it at `get-error-profile.ts:19`. Worse than the original finding: **nothing at the DB level blocks the value** — retirement is enforced client-side only (`LOGGABLE_ERROR_DETAILS` filter in `enums.ts`), unlike `shot_type` which got a real CHECK. So any legacy `double_bounce` rows are invisible to the client while still being counted in `errors_total`:

- The "By type" bar sums `tin + out_top + not_up + out_side + out_back + detail_untagged` — double-bounce errors appear in **no** bucket (they're not `error_detail IS NULL`, so not "untagged" either).
- The "By cause" bar (forced/unforced/untagged) **does** include them — so the two bars, both claiming to break down the same errors, sum to different totals.
- The error wall's "biggest leak" percentages use a denominator that drops these rows, while the fallback copy prints `errors_total`, which includes them.

**Fix.** Either add `double_bounce` to the schema and fold it into `detail_untagged`-style handling, or redefine the RPC to merge it server-side — and add the missing DB CHECK so the enum value is actually retired.

### 1.4 New-match flow hangs forever on sustained transient errors — `entry.tsx:86` · **CONFIRMED** · ✅ **FIXED 27 Aug 2026**

`onStart` awaits `queue.flush()`, whose promise settles only on drain or hard-pause. Retryable errors (5xx/429/408/network failures per `supabase-errors.ts`) loop with capped _backoff delay_ but **no attempt cap, no timeout, no cancel, no `navigator.onLine` short-circuit**. Under a sustained 503 the submit spinner spins forever with the button disabled — and no sync UI is visible, because `SyncIndicator` only mounts inside `LoggingShell`, which requires the very session that never starts. Only recovery: reload.

Scope note from verification: infinite retry is _correct by design_ for the fire-and-forget logging path (retry-until-online, never log past a hole — and the tests encode this). The defect is specifically that a UI path treats `flush()` as bounded. `onStart` handles the `paused` (permanent-error) outcome gracefully but has no branch for "still syncing after too long."

**Fixed twice, and both halves stand. First queue-side (27 Aug 2026):** `WriteQueue` takes a `maxAttempts` (default 6, ≈23s of backoff), and an op whose retryable failures exhaust it pauses exactly like a permanent one. `flush()` therefore always settles, `onStart`'s existing `paused` branch fires, and the logger's `SyncIndicator` offers its Retry. Every caller is covered rather than just this one; the sustained-503 case is now in `write-queue.test.ts`. The tradeoff accepted: a connectivity blip longer than ~23s pauses the logging queue instead of healing itself, which is visible and one tap from resuming (nothing is dropped, nothing lands out of order).

**Then caller-side, removing the premise rather than bounding the wait:** `onStart` no longer touches the queue at all. Starting a match is one `create_match_with_game` RPC, awaited directly, so a sustained 503 fails the request instead of looping — the form shows "Couldn't save the match — check your connection and try again." and stays usable. See §1.8 for the full change. Infinite retry survives where verification said it belongs: the rally-logging path, which has `SyncIndicator` in front of it.

### 1.5 Home "recent results" is nondeterministic on same-day matches — `get-recent-results.ts:18` · **CONFIRMED**

Orders by `date desc` with `limit(8)` and no unique tiebreak — and `matches.date` is a `DATE`, so every match from the same evening ties. Which 8 appear, and in what order, is unspecified and can change between refetches. `get-matches.ts:52` already solves this with a `match_id` tiebreak; this fetcher just never got it. Same-evening sessions are this app's core use case, so the tie isn't an edge case.

**Fix.** Add `.order("match_id")` (or better, order by `created_at` via the RPC/view) to match `get-matches`.

### 1.6 Null `match_winner_id` renders five different ways — one of them flat wrong · **CONFIRMED**

The tri-state (won / lost / null-meaning-drawn-or-ongoing) is re-interpreted inline at every call site with no shared helper:

| Surface                                        | Null winner renders as                        |
| ---------------------------------------------- | --------------------------------------------- |
| Profile match history (`match-history.tsx:53`) | neutral "·" badge, documented "still in play" |
| Profile h2h (`profile-h2h.ts:68`)              | match skipped from the ledger entirely        |
| Compare panel (`h2h-panel.tsx:68`)             | **the word "Drawn"**                          |
| Home recent (`index.tsx:187`)                  | neither name bold, no cue                     |
| Matches list (`matches.index.tsx:226`)         | neither name bold, no cue                     |

The compare panel stamps a decided-draw verdict on the exact value the profile explicitly treats as "a quiet dot, not a false verdict". This is the concrete version of the draws problem discussed on 14 Jul — the planned `matchOutcome` helper in `src/lib/scoring` resolves all five sites at once.

### 1.7 Logger's in-play banner contradicts every read surface for casual leaders — `logging-shell.tsx:250` · **PLAUSIBLE (narrowed)**

`matchWinnerName` is format-gated, so for a casual session the game-over banner says "Played on? Just keep logging rallies." while the SQL view already names the leader as `match_winner_id` — which the home hub and matches list bold as the winner. Narrowed by verification: the **finished** summary is _not_ gated (it uses `tallyMatch` directly and says "X wins 2–1"), so the contradiction is only between the mid-session banner and the read surfaces. Low severity; folds naturally into the draws/outcome work.

### 1.8 A failed match create jammed the queue and orphaned a match row · **FIXED 27 Aug 2026**

`discardFailed()` on a failed **create-match** op dropped only that op, leaving the **create-game** op from the same plan queued — it then ran and FK-failed permanently against the match row that was never created. The original entry under-stated this as "noise". Traced end-to-end against a mocked FK, the stale pause cost more than a second error: the user's *next* submit hit `flush()`'s paused fast-path, so it reported "Couldn't save the match" while its own ops landed in the background — spurious error, no session started, and an **orphan match row**. Only the third attempt worked.

**Fix — the new-match form left the write queue entirely.** Neither of the two suggestions above was taken. Both treated the queue as the right home for a match create and asked it to unwind failure more cleverly; the cheaper answer was to notice that starting a match *isn't rally logging*. It's one form submit of two rows, and it only sat in the queue for FIFO ordering against rally writes that cannot happen until the session exists.

- New `create_match_with_game` RPC (`20260827120000`) writes the match and its game 1 in one transaction, `SECURITY INVOKER` so RLS still decides, execute revoked from `anon`. The half-state is now unrepresentable: no game without its match, and no match without a game 1 to log into. That last one closes the mirror case this entry previously listed as unfixed.
- `entry.tsx` awaits that one call and translates a rejection through `friendlyWriteError`, passing its own fallback sentence.
- `friendlyWriteError` no longer leaks the raw driver message. It fell through to `e.message` for anything it didn't recognise, and supabase-js does **not** rethrow the fetch `TypeError` or put `status` on the error — a dropped connection arrives as a plain object whose message is the string `"TypeError: Failed to fetch"`. Every write form in the app (nine manage surfaces plus this one) would have rendered that verbatim; they now show a sentence. A Postgres rejection still passes its own message through, which is how trigger text reaches the user. Pinned by `friendly-errors.test.ts` against the shape supabase-js actually produces.
- `discardFailed()` **deleted** — the new-match form was its only caller ever; the logging UI has only ever exposed Retry. The `groupId` mechanism added earlier the same day went with it.

**Net effect.** `WriteQueue` is down to `enqueue` / `resume` / `subscribe` (plus `flush`, now test-only and documented as a "settled?" not "succeeded?" wait), doing the one job it earns: keeping the *rally sequence* in order within a session. Three defects close at once — this one, §1.4, and the cross-session jam below — and the code is net smaller.

**Also closed: the cross-session jam.** A user who left a *paused* session and then submitted a new match used to reach the same blind `discardFailed()`, which dropped a **rally** op — the "hole in the rally sequence" §2 refutes on the grounds that the discard is "only reachable from the new-match flow, before any rally exists". The new-match form no longer reads or mutates queue failure state, so a pause carried over from an exited session now simply waits, and reopening that match re-mounts `SyncIndicator` with its Retry. §2's conclusion holds again, by a different route than it argued.

Coverage: `supabase/tests/create-match-with-game.test.ts` runs the real migration under PGlite — atomicity (a failing game insert rolls the match back), house-rule mapping, defaults, and the anon/authenticated grants — plus `create-match.test.ts` for the client mapping and error pass-through.

**Raised in likelihood by the §1.4 fix (27 Aug 2026).** This used to need a _permanent_ create-match failure (RLS denial, CHECK violation — rare). Now any sustained outage reaches the same branch, and the residue is worse than noise: the orphan create-game FK-fails permanently and leaves the queue **paused**, so the user's next attempt — connectivity restored — takes `flush()`'s paused fast-path, shows "Couldn't save the match" _spuriously_, and starts no session while its own ops land in the background, creating an orphan match row. The attempt after that succeeds. Traced end-to-end with a mocked FK. Worth taking now, not later.

---

## 2. Investigated and refuted (so nobody re-chases these)

- **"Best-of 1/7/9 in the form violates the DB CHECK `(3,5)`" — REFUTED.** `20260702221549_house_rules.sql` explicitly widened the constraint to `format is null or (format % 2 = 1 and format between 1 and 9)`. Zod, the form (`1/3/5/7/9` + casual), and the DB are aligned. (This also corrects a claim made in conversation on 14 Jul that the live constraint was `(3,5)`.)
- **"`discardFailed()` punches a hole in the rally sequence → corrupted scores" — REFUTED.** It's only reachable from the new-match flow (before any rally exists); the logging surface exposes Retry, never Discard; and a `rally_number` gap would derive _correct_ scores anyway (the window orders by rally_number, it doesn't index). The header invariant holds. See §1.8. (The "only reachable from the new-match flow" premise briefly did not hold — "Pause & exit" can leave a paused rally op at the head of the shared queue, which the new-match flow's blind discard would drop. Moot since 27 Aug 2026: `discardFailed()` is deleted and the new-match form no longer touches the queue.)
- **"`gameOver` target/tiebreak logic can disagree with the recorded winner" — cleared.** Advisory-only by design (§7.7 tier 3); the recorded outcome flows through `gameResult`/`tallyMatch`, which are fixture-pinned to the SQL.
- **"`get-match-detail` is single-consumer route code misplaced in `lib/api`" — REFUTED.** It's genuinely shared: logger (`logging-shell.tsx:42`) + match-detail route. Placement is correct.
- **SQL derivations — clean bill.** Window frames, `DISTINCT ON` ordering, `format/2+1` integer division, `COUNT FILTER` over the left join: all verified correct.
- **"Profile 'reads real data' claims are misleading" — REFUTED.** Every rendered figure traces to the insight RPCs; fixtures are imported by tests only.
- **Crash-on-empty audit — clean.** All `reduce`/`[0]`/division sites in dashboard libs are guarded (details in the UI sweep, §8).

---

## 3. Efficiency

- **Six insight RPCs per profile load, each re-scanning the same rally set** (`use-player-insights.ts:22`). Every one calls `filtered_rallies()` → `rallies_scored` (window functions over the whole rallies table). Same params, six round-trips, six scans (seven with h2h). A combined `player_insights` RPC returning all six payloads in one row would collapse this. The 6-query facade is also the one breach of one-query-per-hook (see §4).
- **`rallies_scored` windows over the entire rallies table for every consumer** — and four of the six aggregate RPCs discard the running scores it computes. Cost grows with total rallies logged, not with the result requested. Options, in escalating effort: a window-free variant for count-only aggregates; or materialise per-game final scores maintained on write. Not urgent at current volumes; will matter first on the profile page.
- **Profile loader eagerly fetches the unpaged h2h scan for a non-default tab** (`players.$playerId.index.tsx:42`). `playerH2hQueryOptions` fetches _every_ `match_results` row for the player up front, but h2h feeds only the Stats tab; Summary is the default. The Matches tab already demonstrates the right pattern (lazy fetch on mount). Move h2h out of the loader.
- **The profile fetches the same `match_results` rows twice** — the unpaged h2h read and the paged history read (`get-player-match-history.ts` → `fetchMatches`) overlap entirely. The history could derive from the h2h array already in cache (plus its one `game_results` read), or better, both could ride the lazy-tab pattern.
- **`fetchPlayerMatchHistory` fetches 20 rows + exact count to render 8** (`get-player-match-history.ts:29`). Deliberate reuse of `fetchMatches` at the time; still over-fetch. A `.limit(8)` read with only the rendered columns fixes it (the exact count is still needed for the "See all N" link — keep `count` but drop the surplus rows).
- **`get-match-detail` selects `*` + `rallies(*)`** — defensible for a detail view per the house convention, but ~half the columns are unused by its consumers. Trimming to explicit column lists is cheap insurance against payload creep.
- **Drill-through rally RPCs are unbounded** (`serve_rallies`, `error_rallies`, `rally_length_rallies`, `comeback_rallies`) — full rally detail with no LIMIT. Fine today, latent payload problem at volume; optional `p_limit` would future-proof.

---

## 4. RPC and data-fetching conventions

Full inventory (4 views, 17 RPC signatures) traced to client callers; the layer is in good shape overall — per-player scoping is consistent (`p_opponent_id`/`p_ball_type`/`p_date_from`/`p_date_to` uniform across all siblings), no RPC leaks data beyond its params, list fetches are paginated with explicit column lists (`get-matches` is the model citizen), and superseded RPC bodies in old migrations are append-only history, not live duplicates.

**Findings:**

- **Orphaned server surface:** `errors_attributed` view — zero client callers, zero RPC consumers; only a derivation test reads it, while the production error-maker rule lives inline in `error_profile` (a second definition that can drift). Drop the view and point the test at `error_profile`. ~~`h2h_rallies` RPC is orphaned from the client side~~ — **resolved 27 Aug 2026:** the compare panel's drill-through calls it (§6).
- **Over-broad grants:** `filtered_matches` / `filtered_games` / `filtered_rallies` are internal SQL helpers, never called client-side, yet granted EXECUTE to `anon, authenticated`. Revoke; keep grants on the aggregates and drill-throughs only.
- **Client-side aggregation where an aggregate RPC belongs:** the profile h2h table fetches **all** of a player's `match_results` unpaged and folds them in TS (`computeH2h`) — logic that overlaps the existing pairwise `h2h` RPC. The gap is a missing `player_rivals(p_player_id)` returning one summary row per opponent. (The code comment acknowledges and defends the unpaged read; it's still the one clear breach of the summaries-vs-detail convention, and it grows O(matches).)
- **Multi-fetch hooks, adjudicated:** `usePlayerInsights` fires 6 queries (breach — but each payload is independently cached; the real fix is the combined RPC, §3). `fetchPlayerMatchHistory` and `fetchManageGames` make 2 round-trips each — justified, PostgREST can't join across views. `fetchHomeCounts`' two head-counts — justified.
- **Query-key hygiene:** no collisions. Two shape inconsistencies: momentum/comeback append a trailing `deficit ?? null` segment no other key has, and `rally-length-rallies` puts `bucket` _before_ `filters` while every sibling puts filters last. Standardise `["insights", name, ...ids, filters, ...extras]`. Naming smell: `["matches","recent"]` (raw matches) vs `["matches","recent-results"]` (view) are confusingly close.
- **`players_headline` takes no filters while its engine supports all four** — documented as intentional ("roster shows the all-time picture"); flagged only so it isn't mistaken for a bug.

---

## 5. Reuse and duplication

- **`nameOf` is hand-rolled at 10 sites with 3 different fallbacks** — `"—"` (logging-shell), `"Unknown"` (recent-matches, player-match-history, profile route, home route), `id.slice(0,8)` (all four manage tabs). A deleted/unknown player renders differently on every surface. One `makeNameLookup(players)` in `src/lib` with one agreed fallback; `match-history.ts`/`profile-h2h.ts` could stop threading `nameOf` as a parameter.
- **Short-date formatting duplicated and divergent:** two live copies of `MONTHS`+`formatDate` (`match-history.ts` — "9 Jul"; `routes/index.tsx` — "9 Jul 2026"), plus **raw ISO dates rendered to users** on four surfaces (`matches.index.tsx:222`, `matches.$matchId.tsx:161`, `category-content.tsx`, `h2h-panel.tsx`) and a fourth format in manage cells. One shared formatter; route the ISO surfaces through it.
  _27 Aug 2026:_ still open, deliberately. The Broadcast pass rewrote the `category-content` and `h2h-panel` rows and left the ISO dates on them: a fourth private `formatDate` would have deepened the duplication this entry is about, and the three existing copies disagree on format (`9 Jul` vs `9 Jul 2026`), so picking one is a call to make across all of them at once, not in passing.
- **Player-first orientation flip duplicated** (`profile-h2h.ts:46`, `match-history.ts:39`) — the `isP1 ? p1 : p2` mirror including the `?? 0` guards. A shared `orientToPlayer(match, playerId) → { mine, theirs, rivalId }` gives the concept one home (the SQL side already centralises this in `filtered_matches`).
- **`match_results` select strings duplicated as raw strings** (`get-recent-results.ts:15`, `get-player-h2h.ts:20`, superset in `get-matches.ts:36`) while the players API already derives its columns from the zod shape (`PLAYER_SUMMARY_COLUMNS`). A `MATCH_RESULT_COLUMNS` from `matchResultSummary.shape` closes the drift channel.
- **`fold-match.ts` re-implements running-score accumulation** that `lib/scoring` owns and fixture-pins. The dashboard fold is a second, unpinned copy of the windowed-count rule — the match timeline would silently keep old semantics if the rule ever changed. Fold should build on `runningScores`.
- **`computeH2h` vs the `h2h` RPC** — same tallies maintained in TS and SQL (see §4, `player_rivals`).

---

## 6. Dead code

> **Corrected 27 Aug 2026.** Three of the five files below were not dead code awaiting deletion. They were a working feature with no way in — and this section's own reasoning is what hid that. See the note under the tables.

**Zero importers — and what each turned out to be:**

| File                        | July verdict                                                          | Now                                                                                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `insight-previews.tsx`      | 5 internal components, all unreachable; carries drifted W/L styling   | **Alive.** Deleted on this advice in Aug 2026 and restored once the tiles gave it callers again — four of the five ride in them. `FormDotsPreview` _was_ the drift the note spotted, a round-dot duplicate of `FormGuide`, and stays deleted. |
| `insight-card.tsx`          | _(no note)_                                                           | **Alive.** It was the only link into the category route; restored to the profile above the tabs.                                                                                                                                              |
| `player-recent-matches.tsx` | superseded by profile redesign chain                                  | Deleted, correctly.                                                                                                                                                                                                                           |
| `profile-stat-strip.tsx`    | _(no note)_                                                           | Deleted, correctly — the one entry here that was simply right.                                                                                                                                                                                |
| `get-h2h-rallies.ts`        | all 3 exports unreferenced; strands the `h2h_rallies` RPC server-side | **Alive.** Not a leftover but the unbuilt half of a feature: the compare page's record now drills through it to the rallies behind it.                                                                                                        |

**Cleared as alive (do not delete):** `h2h-panel.tsx` (via `/compare`).

~~`category-content.tsx` + `win-rate-trend.tsx` + `momentum-chart.tsx` (via `players.$playerId.$category`)~~ — **alive, but the reasoning was wrong, and it mattered.**

**Why this section missed it.** Reachability was taken to mean _a route renders it_. It doesn't: a route nothing links to is reachable only by typing a URL. `insight-card.tsx` held the codebase's only `to="/players/$playerId/$category"`, so listing it as a deletable dead file and clearing `category-content.tsx` as alive-via-that-route were the same mistake read from two ends. Deleting the file as advised would have stranded the whole chain — the route, `category-content.tsx`, `filter-bar.tsx`, `categories.ts`, `insight-filters.ts`, `rally-table.tsx`, `stat-card.tsx` and the four chart components, plus five tested RPCs — about 1,900 lines that no user could reach.

The orphaning was accidental. `a74737a` rebuilt the profile against a fixture ("no loaders, no queries — so the layout can be signed off before the insight RPCs are wired back in") and the tile grid went with the old structure; the RPCs came back for the tabs, the tiles never did. This audit was generated from `a74737a` itself, so the link had been gone for exactly one commit when the sweep ran.

**The check to run instead.** Zero importers means _this file_ is unused. Before calling it deletable, ask what is unreachable _because_ it is unused — for a component that holds a link, that is everything on the other side of it. `rg -n 'to="/<path>"' src` over each route in `routeTree.gen.ts` finds routes with no inbound link.

**Dead flesh on live code:**

- `EndReason` union in `src/lib/scoring/types.ts:12` still lists `"ace"` — retired by migration 20260710160000, filtered from every UI path. (The zod enum keeping `'ace'` for reads is _correct_ — legacy rows; only the hand-written union is stale.)
- `deficit` param threaded through fetch/options/hook/queryKey in `get-momentum.ts` and `get-comeback-rallies.ts` — no caller ever passes it. Six signatures of dead configurability; drop it (or actually expose the knob).
- `errors_attributed` view (§4).

---

## 7. Organisation and conventions

- **`features/dashboard/lib/` (~12 source files) is an undocumented tier.** `docs/architecture.md:49` sanctions `features/<x>/{api,components,schemas,utils}` — no `lib/` — and dashboard _also_ has a `utils/`, so contributors face two competing homes for the same category. Decide once: bless `lib/` in the docs (and say how it differs from `utils/`) or fold the two together. `categories.ts` at the feature root falls outside every documented bucket too.
- **`category-content.tsx` holds 9 components** (~345 lines): dispatcher + 5 substantial per-category panels. The strongest split candidate in the repo (e.g. `category-panels/`). _27 Aug 2026: still open — the Broadcast pass restyled the file and left its shape alone, so it is now 10 components in ~330 lines._ `match-history.tsx`'s 5 components are cohesive private helpers — fine. `manage/cells.tsx` is a deliberate primitives module — fine.
- **Pure chart-data transforms live in component files** (`toErrorTypeData`, `computeLeadSeries`, `toHistoBuckets`, `shouldPlotLine`, `toRadarData` etc.) so `charts.test.ts` imports from `components/`. Extracting to a feature-lib module would clean the tier boundary. Low priority.
- **`signature-line.test.ts` names a module that doesn't exist** (tests `signatureLine` from `player-attributes.ts`). Rename the test file or extract the function.
- Otherwise clean: no cross-feature imports anywhere (the eslint boundary works), every shared component genuinely shared, kebab-case consistent, mutation naming (`create-/update-/delete-`) consistent, § spec citations in the data layer resolve correctly.

---

## 8. UI consistency and truthfulness

- **Failures render as empty states (systemic).** Home page: a failed roster query shows "No players yet" — indistinguishable from a fresh install; failed results/counts silently vanish (`index.tsx:65,78,142`). Six more surfaces show a **perpetual skeleton** on error (`h2h-panel`, `player-match-history`, four `category-content` sections). `usePlayerInsights` swallows error state entirely, so an RPC failure renders a profile of dashes as if the player had no data. The correct pattern already exists in `manage/data-table.tsx:55` and `entry.tsx:47` — port it.
- **Two competing W/L visual conventions:** emerald/red badges (match history, h2h table, roster dots) vs bold-winner/no-colour (home recent, compare panel, category content). Same concept, different languages. A `--win`/`--loss` token pair + one badge component would fix drift and theming at once. Bonus: `h2h-panel.tsx:65-70` contains a redundant ternary (both winner branches return `"font-semibold"`).
- ~~**Navigation dead-end:** the compare panel's match rows are the only match list in the app that doesn't link to the match detail.~~ **Fixed 27 Aug 2026** — the rows are `Link`s, and the panel drills on to the rallies underneath them.
- **Touch/a11y:** manage table sort icons are `opacity-0` until hover — invisible on touch (relevant given mobile-first scope); sortable headers lack `aria-sort`. Otherwise a11y is strong: every `role="img"` SVG labelled, icon buttons labelled, no focus traps.
- **Date formats:** four variants including raw ISO — see §5.
- **Panel/section shells:** `profile-stats-tab` re-declares the `PROFILE_PANEL` card shell locally; ~~`category-content` has a third section primitive~~. _27 Aug 2026: half done — `category-content` and `h2h-panel` now use `ProfileSection`/`PROFILE_PANEL` (`lede` became optional to let them). `profile-stats-tab`'s local shell is still open._

---

## 9. Tests

**State: genuinely good.** Behaviour-driven throughout (no tautological or snapshot tests found), golden-fixture parity between the scoring lib and SQL, fixtures verified in sync with the zod schemas field-for-field, and — worth recording because everyone assumed otherwise — draws/ties, overtime, sudden-death, lets, and single-serve matches are all covered.

**Gaps, riskiest first:**

1. **`intentToOp` (`session-ops.ts`) has zero real coverage** — the translator every logger write flows through is `vi.mock`ed out in the only test that touches it. The riskiest untested unit in the repo.
2. **`decisive_shots` is the only RPC with no SQL test** — and it _can't_ be tested yet: the golden fixtures carry no `winning_shot`/`losing_shot` data. Extending `fixtures/schema.ts` unlocks it.
3. **No shared vitest setup file** — every jsdom test re-declares `cleanup` and its own stubs; `ResizeObserver` is stubbed in exactly one file (attribute-radar); nothing stubs `matchMedia`, so a future `match-history.tsx` component test fails mysteriously. One `setupFiles` with the standard stubs ends the whack-a-mole (this repo has hit both gotchas before).
4. **Empty-dataset RPC behaviour never exercised:** `rally_lengths.avg_length` null, empty `recent_games`/`trend`, `momentum.longest_streak_game_id` null — documented in schema comments, asserted nowhere.
5. Untested logic with branches: `friendlyWriteError`, `humanise`, `categoryLabel`; `manage-list.ts` page→range math (and no last-partial-page pager test); resume-mid-game (a game with existing rallies) never driven.
6. Latent drift: `fixtures/schema.ts` hardcodes the enums in parallel with the DB instead of deriving from `Constants` like `enums.ts` does — they match today; a future enum migration desyncs them silently.
7. Untested interactive components (accepted risk, listed for completeness): `match-setup`, ~~`filter-bar`~~, all four manage edit dialogs, `duel-picker`, `sync-indicator`.
   _27 Aug 2026:_ the catalogue pass covered most of these. The category chain, which had nothing at all, gained the profile tiles, the five category boards, and the head-to-head panel — all rendering offline against seeded query keys, so it is the real component on the real code path. Stories, not assertions: they catch "it renders and looks right", not regressions in logic.

---

## 10. Product gaps surfaced by the audit

- **Draws are not first-class** — §1.6 is the evidence this is already user-visible, not hypothetical. The agreed plan (shared `matchOutcome` in `lib/scoring`, no schema change) resolves all five inconsistent surfaces; the compare panel's "Drawn" and the logger banner (§1.7) should ride along.
- **In-play matches are indistinguishable from finished ones** on every list surface (the null-winner problem's other face). The `matchOutcome` helper's "pending" arm gives lists an honest "in play" cue for free.
- **Match detail shows no in-play state** — related to §1.2: once the winner comes from the view, the null case needs deliberate copy ("In play — 2–1 up" beats "Casual session.").
- **History note column** still TBC by explicit decision (derivable from `rallies_scored`: longest rally, comeback, streak).
- **Compare panel filter asymmetry** — matches list has player/ball/date filters, profile history has none. Possibly deliberate; decide once and note it.

---

## 11. Priority shortlist

**P0 — correctness, small diffs, do first**

1. Shared `invalidateDerived()` in every mutation + logger exit (§1.1)
2. Match detail: use `tallyMatch`/view winner (§1.2)
3. `double_bounce`: schema + RPC merge + the missing DB CHECK (§1.3)
4. ~~Timeout/cancel on the new-match `flush()` await (§1.4)~~ — done 27 Aug 2026 (attempt cap in `WriteQueue`); its follow-on, §1.8, is now the live one
5. Tiebreak on `get-recent-results` ordering (§1.5)

**P1 — truthfulness of surfaces** 6. Error states: kill the failure-as-empty and perpetual-skeleton patterns (§8) 7. `matchOutcome` helper + draws plan — resolves §1.6, §1.7, §10 in one move 8. Prettier pin + one reformat commit + CI gate (§0)

**P2 — debt with compounding interest** 9. ~~Delete the 5 dead files~~ → all five resolved: two deleted, three turned out to be a live feature with no way in (§6). Still open: `errors_attributed` + stale `"ace"` + `deficit` param 10. Consolidate `nameOf` / date formatting / W-L badge / `MATCH_RESULT_COLUMNS` (§5) 11. `intentToOp` test + shared vitest `setupFiles` (§9)

**P3 — structural, schedule deliberately** 12. Combined `player_insights` RPC + lazy h2h + `player_rivals` (§3, §4) 13. `features/<x>/lib` vs `utils` ruling in architecture.md + `category-content` split (§7) 14. Revoke `filtered_*` grants; standardise query-key shapes (§4) 15. `decisive_shots` SQL tests via fixture extension (§9)

---

_Generated 14 Jul 2026 from main @ a74737a (+2 audit-time commits) by /code-review (high) over the data layer plus a 12-agent manual sweep; 8 correctness candidates independently verified (6 confirmed, 1 plausible-narrowed, 3 refuted and recorded in §2)._
