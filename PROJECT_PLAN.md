# Squash Tracker — Project Brief

> **Status:** living project brief. We are building this out section by section before writing any
> code. Legend: ✅ complete · 🚧 in progress · ⬜ not started.
>
> | # | Section | Status |
> |---|---|---|
> | 1 | Product overview & principles | ✅ |
> | 2 | Foundations — information architecture & navigation | ✅ |
> | 3 | Insight model — levels & drill-through map | ✅ |
> | 4 | Visual language — editorial design system | ✅ |
> | 5 | Page specifications | ✅ |
> | 6 | Component library & data-to-UI mapping | ✅ |
> | 7 | Database design | ✅ |
> | 8 | Tech architecture | ✅ |
> | 9 | Build roadmap & milestones | ✅ |
> | 10 | Cross-cutting concerns | ✅ |

---

## 1. Product overview & principles

A personal two-player squash analytics app. Matches are filmed, reviewed afterwards at ~2x speed,
and logged **rally-by-rally** through a fast entry form. The footage is a counting aid only — never
stored, linked, or uploaded. Output is a dashboard of head-to-head stats and deeper insights.

One **TanStack Start** app (React + TypeScript) backed by Supabase (Postgres). No video storage, no
ML — every insight is SQL aggregation over rally-level data. Think "the Score Squash live-scoring
workflow, but capturing far more per rally than won/let, feeding a real analytics dashboard."

**Two modes, one app:**
- **Public dashboard** — read-only, anyone can view; doubles as a portfolio showcase.
- **Private portal** — Supabase-auth gated, owner-only; where matches are set up and rallies logged
  (and records edited).

**Product principles**
1. **Rally-level truth.** One row per point; everything interesting is derived from the ordered
   sequence, not from final scores.
2. **The logger is the make-or-break feature.** Fast, keyboard-first, effortless at 2x. Build and
   dogfood it before the analytics.
3. **Review discipline decides success, not tech.** Minimum usable logger first; only invest in deep
   analytics once real data exists.
4. **Honest stats.** Small samples are shown with counts, not just rates; the UI never over-claims.
5. **Editorial, portfolio-grade design.** Restrained, typographic, confident — swappable via tokens.

---

## 2. Foundations — information architecture & navigation

Players are first-class: every player has their own insight page, and any set of players can be
compared. All data is public-read; all writes are owner-only (enforced by RLS).

### 2.1 Sitemap

**Public (read-only, no auth):**

| Route | Purpose |
|---|---|
| `/` | Home hub — player roster (cards with a headline stat) + recent matches |
| `/players/[id]` | A player's insight **overview** — summary cards linking to detail pages |
| `/players/[id]/[category]` | That player's dedicated insight page (serve · errors · rallies · comebacks/streaks …) |
| `/compare` | Select 2+ players → side-by-side profiles (+ head-to-head when they've met) |
| `/matches` | Match history list |
| `/matches/[id]` | Match detail: games + rally timeline (the deep drill target; presentation-only) |
| `/manage` | Raw tabular browse of all records; public to view, editable when owner is logged in |

**Private (owner, Supabase auth):**

| Route | Purpose |
|---|---|
| `/login` | Auth |
| `/entry` | The logger (single stateful screen) |

### 2.2 Global navigation

- Persistent top bar: wordmark (→ `/`), **Players**, **Matches**, **Compare**, **Manage**. Owner-only
  when logged in: **Log** (`/entry`) + account/logout; logged-out owner sees a discreet **Login**.
- **Compare** is entered from the nav or by multi-selecting players on the home roster and hitting
  "Compare".
- Breadcrumbs on drill pages (player → category; match detail).

### 2.3 Player & opponent model

- Players are first-class entities; each has `/players/[id]`.
- Player insight pages **aggregate across all opponents by default**, with an **optional opponent
  filter** ("vs Dave") to scope any insight to a single head-to-head.
- **`/compare`**: side-by-side aggregate profiles (win % · error profile · serve stats · rally length)
  for the selected players. When exactly two are selected *who have actually played each other*, also
  show their head-to-head record.

### 2.4 Click-through hierarchy (the spine)

```
Home / Player overview   →   Category insight   →   Match detail   →   Rally
   headline KPIs              breakdown + trend       game timeline      the point
```

- Every top-level number offers a path down to the rallies that produced it.
- `/manage` is an **orthogonal flat table** across all records (raw view), not part of the drill chain.

### 2.5 Access model

- All data public-read; all writes owner-only (RLS).
- **`/manage`** is public to *view* and editable only when the owner is logged in — it is both the raw
  data browser and the edit surface.
- **`/matches/[id]`** is presentation-only; when logged in it links through to the record in `/manage`
  for edits.

### 2.6 Entry flow (structure only — full spec in §5.3)

- A **single stateful screen** at `/entry`. Flow: choose **new match** (players, date, venue, format,
  tiebreak, ball) or **reopen an existing match** to append/edit → land in the logger (score, current
  server, outcome controls, live rally list) → log → done. No page navigation mid-logging. Every match
  is considered finished as logged; "resume" is just editing.

---

## 3. Insight model — levels & drill-through map

The content spine. Every top-level number has a path down to the rallies that produced it.

### 3.1 Levels of insight

```
L1  Headline KPIs      home roster cards + player overview hero        → win rate
L2  Category pages      full breakdown for one theme, + trend           → /players/[id]/[category]
L3  Match detail        one match's games + rally timeline              → /matches/[id]
L4  Rally               the individual point                            → rally row / drawer
```

### 3.2 Headline KPI — win rate

The single hero stat on every roster card and player-page header is **win rate** — games won ÷
**decided** games (games whose last rally left them tied/`is_undecided` are excluded from the
denominator). All opponents by default; always shown with its denominator (§3.5). Source: `game_results`.

**Signature trait** (the one-liner on the player header): *grinder* if win rate on long rallies (9+
shots) beats win rate on short rallies (1–3) by ≥10 points; *shotmaker* if the reverse; otherwise
*balanced*. Requires ≥30 rallies in each bucket, else omitted. Computed in `player_headline`.

### 3.3 The five categories

Each is a summary card on the player overview (L1) linking to a dedicated page (L2). Every L2 stat
drills to the underlying rally set → the match (L3) → the rally (L4).

**1. Head-to-head (results & form)**
- L1 card: win rate + games/matches record.
- L2 page: win rate over time (line by date), games & matches record, recent results list, current
  form (last N), record vs each opponent (mini table).
- Drill: a result → `/matches/[id]`. Sources: `match_results`, `game_results`.

**2. Serve** — pinned derivations (the `serve_stats` RPC implements exactly these; **all serve
denominators exclude lets**, since a let + its replay would otherwise double-count one serve):
- Serve win % = decided rallies won as server ÷ decided rallies served.
- **First-serve-fault rate** = decided rallies with `serve_number = 2` ÷ decided rallies served
  (first-serve faults are never rows — they exist implicitly as points played on serve 2).
- **Double faults** = `end_reason = 'serve_fault'` rows (always second serve, by CHECK).
- Plus: aces, points won on serve vs return, 1st vs 2nd-serve win %, **win rate by serve side**
  (court visual). Optional trend over time.
- Drill: any stat → its rally set → match. Sources: `rallies_scored`, `errors_attributed`.

**3. Errors**
- L1 card: unforced errors per game.
- L2 page: error rate, tin / out_top / out_side / out_back split (bar), forced vs unforced,
  not_up vs double_bounce, errors-per-game trend.
- Drill: an error type → the rallies of that type → match. Source: `errors_attributed`.

**4. Rallies**
- L1 card: average rally length (shots).
- L2 page: **both** — average length as the hero *and* a distribution histogram in buckets
  (1–3 / 4–8 / 9+) with **win rate per bucket** (the grinder-vs-shotmaker read); longest rally.
- Drill: a bucket → rallies in it → match. Sources: `rallies` (shot_count), `rallies_scored` (win).

**5. Momentum** — pinned definitions (the `momentum` RPC implements exactly these):
- **Comeback** = trailed by **≥4** at any point in a game, then won that game (deficit is an RPC
  param, default 4).
- **Streak** = longest run of consecutive rally wins **within a game**, lets excluded.
- **Phase bands** (supporting visual only) = a rally belongs to a band by the *leading* score after
  it: ≤4 early · 5–8 mid · **9+ close** (open-ended to absorb win-by-2 overtime; thresholds scale
  proportionally for non-11 `target_score`).
- L1 card: comebacks (count). L2 page: comeback list (each with its momentum chart), longest streaks,
  phase win-share visual.
- Drill: a comeback/streak → its game's rally timeline. Source: `rallies_scored`, `game_results`.

### 3.4 Drill-through map

```
roster card (win rate) ─▶ /players/[id]  (overview: 5 category cards)
   category card ────────▶ /players/[id]/[category]  (L2 breakdown + trend)
      any stat ──────────▶ filtered rally set (inline list / drawer)
         a rally ────────▶ /matches/[id]  (game timeline, that rally highlighted)
```

- `/compare` runs the same L2 breakdowns side-by-side for selected players, plus head-to-head when two
  who've played are chosen.
- `/manage` is orthogonal — a flat raw table across all records, not part of this chain.

### 3.5 Small-sample honesty (applies everywhere)

- **Every rate shows its denominator** — "68% · 15 of 22", never a bare "68%".
- Any stat below a minimum sample shows a quiet **"not enough data yet (n=X)"** state instead of a
  misleading number. Thresholds are tunable; starting points: ≥5 games for win rates, ≥30 rallies for
  rally-level rates, ≥5 matches before drawing a trend line (otherwise plot points only).
- The UI never extrapolates or implies significance from thin data.

### 3.6 Cross-cutting dimensions (filters, not categories)

Some data slices *any* insight rather than being its own page:
- **Opponent** — the "vs Dave" filter (§2.3).
- **Ball type** — blue / red / yellow / double_yellow (bounce → difficulty; blue is bounciest/easiest,
  double_yellow the coldest/hardest). A colder ball lengthens rallies and shifts error rates, so
  "performance by ball type" is a real insight. Stored per match; surfaced as a filter and a small
  supporting comparison (error rate & rally length by ball).
- **Time / season** — date-based trends.

---

## 4. Visual language — editorial design system

Built on **shadcn/ui (CLI v4, `maia` style)**, scaffolded and themed from preset **`b4aRKOtyXC`**. All
colour / typography / radius tokens come from the preset — we never hardcode values; we layer a chart
convention and the squash-court motif on top.

### 4.1 The preset (token source of truth)

```
npx shadcn@latest create --name squash --template start --preset b4aRKOtyXC
```

| Axis | Value |
|---|---|
| Component style | maia |
| Base neutral | olive (warm) |
| Accent / primary | orange |
| Chart colour | red |
| Icons | lucide |
| Body font | Nunito Sans |
| Heading font | Merriweather (serif) |
| Radius | default (~0.5rem) |

Re-theming later is one command: `npx shadcn@latest apply <code> --only theme,font`.

### 4.2 Typography

- **Headings — Merriweather (serif):** page titles, section headers — the editorial voice.
- **Body / UI — Nunito Sans:** labels, tables, controls; rounded humanist, friendly-legible.
- **Numbers — tabular figures** (`font-variant-numeric: tabular-nums`) wherever stats appear, so values
  don't jitter; hero KPI numbers sized large in Nunito Sans tabular.
- Sentence case throughout; restrained weight usage.

### 4.3 Colour & tokens

- **Semantic shadcn tokens only** (`bg-background`, `text-muted-foreground`, `bg-primary`,
  `text-primary`…). No raw hex, no manual `dark:` overrides — the preset drives light + dark.
- Warm olive neutrals + orange accent give a warm "paper" editorial feel; red chart ramp for data.
- Accent used sparingly — highlights, primary actions, key data — never as wallpaper.

### 4.4 Layout & density

- Centred max-width content column; generous whitespace; `Card` composition; `Separator` for rules.
  Navigation via a persistent **top bar** (§2.2) — no sidebar; seven routes don't need one.
- Bento-style modular tiles on the player overview; calmer editorial stacking on detail pages.

### 4.5 Charts

- shadcn **Chart** (wraps Recharts) via `ChartContainer` / `ChartTooltip`. Thin ~1.5px lines, hairline
  axes, minimal gridlines, red chart ramp + neutrals. Signature viz: the diverging **momentum area**;
  plus stacked error bars, the rally-length histogram, and win-rate-over-time lines.

### 4.6 Squash-court motif

- A custom SVG court (service boxes, short line) is our one signature flourish — used for serve-side
  win-rate stats, as a quiet empty-state graphic, and as the wordmark. Styled purely with theme tokens
  (`border`, `primary` at opacity) so it adapts to light/dark.

### 4.7 shadcn component map

- Nav: `NavigationMenu` (top bar), `Breadcrumb`. Data: `Card`, `Table`, `Badge`, `Avatar`, `Chart`.
- Entry form: `Field` / `FieldGroup`, **`ToggleGroup`** for outcome/side selectors, `Select`, `Input`.
- Overlays: `Sheet` / `Drawer` for rally detail, `Dialog` for confirms, `Command` for quick nav.
- Feedback: `Sonner` toast (optimistic-save confirmation), `Skeleton` (loading), `Empty`
  (not-enough-data states from §3.5).

### 4.8 Motion

- Subtle only: number count-ups on stat reveal, soft page/section transitions. Nothing flashy.

---

## 5. Page specifications

For each page: purpose, layout, contents, components, states (empty / loading / error /
small-sample), and interactions.

### 5.1 Public dashboard — home, player pages, compare

All read-only (public). When the owner is logged in, discreet "edit in manage" links appear; nothing
else changes. A consistent **filter bar** (opponent · ball type · time range) sits on player and
category pages and its selection carries between them.

#### `/` — home hub
- **Purpose:** the front door and portfolio showcase; routes to players, matches, compare.
- **Layout (top → bottom):**
  1. Global nav — wordmark + court mark; links: Players, Matches, Compare, Manage (owner: Log, login).
  2. Slim hero — court-motif graphic + one headline figure ("N rallies logged across M matches").
  3. **Player roster** — responsive grid of player cards. Each: name, handedness dot, **win rate**
     (with denominator), a small form sparkline, W–L record. Click → `/players/[id]`; selecting 2+
     reveals a **Compare** button.
  4. **Recent matches** — compact list (date · players · games score · ball type) → `/matches/[id]`;
     "View all" → `/matches`.
- **Components:** `NavigationMenu` (top bar), `Card`, `Badge`, `Avatar`, `Chart` (sparkline), `Table`,
  `Button`, `Empty`.
- **States:** no data → `Empty` with a friendly prompt (owner sees an "add" link); loading → `Skeleton`.

#### `/players/[id]` — player overview
- **Purpose:** one player's game at a glance; gateway to the category detail pages.
- **Layout:**
  1. Header — name, handedness, **win-rate hero** (with denominator), games & matches record, and a
     one-line signature read (e.g. "grinder — wins 61% of 9+ shot rallies").
  2. **Filter bar** — opponent · ball type · time (persists to category pages).
  3. **Five category summary cards** (grid): head-to-head · serve · errors · rallies · momentum — each
     a headline number + mini viz → `/players/[id]/[category]`.
- **Components:** `Card`, `Badge`, `Select`/`ToggleGroup` (filters), `Chart` (mini), `Separator`.
- **States:** thin data → cards show "not enough data yet (n=X)" (§3.5); loading → `Skeleton`.

#### `/players/[id]/[category]` — category detail
- **Purpose:** the full breakdown of one theme (contents per category defined in §3.3).
- **Layout (shared template):**
  1. `Breadcrumb` (player → category) + header + the same filter bar.
  2. **Key stat row** — 2–4 metric cards for this category.
  3. **Primary chart(s)** — per category: serve → court motif + 1st/2nd-serve bars; errors → stacked
     type bar + forced/unforced; rallies → length histogram + average; momentum → comeback list (each
     with its momentum chart) + phases supporting viz; head-to-head → win-rate-over-time + results list.
  4. **Underlying rallies** — a filterable `Table` of the rallies behind the stat, fed by the
     insight's `*_rallies` companion RPC (§8.4 — same WHERE logic as the aggregate, so the list can
     never disagree with the number); row → `/matches/[id]` (that rally highlighted); a single rally's
     full detail opens in a `Sheet`/`Drawer`.
- **Components:** `Breadcrumb`, `Card`, `Chart`, `Table`, `Sheet`, `Badge`, `Empty`.
- **States:** small-sample & empty-table handling as §3.5; loading skeletons.

#### `/compare` — compare players
- **Purpose:** put selected players' profiles side by side.
- **Layout:**
  1. Player selector (add/remove; 2+), via `Command`/`Combobox`.
  2. **Side-by-side columns** — each player's key profile (win rate · error profile · serve stats ·
     rally length) aligned row-by-row so values/bars compare directly.
  3. **Head-to-head panel** — shown when exactly two are selected *who've played each other*: their
     record + a highlights/momentum snippet.
- **Components:** `Command`/`Combobox`, `Card`, `Table`, `Chart`, `Badge`.
- **States:** <2 selected → prompt to add players; two who haven't met → show profiles with a "haven't
  played each other yet" note.

### 5.2 History / browse (match → game → rally)

#### `/matches` — match history
- **Purpose:** every match, newest first; the archive entry point.
- **Layout:** filter row (player · ball type · date range) above a `Table`/card list — each row: date ·
  players (winner emphasised) · games score (e.g. 3–1) · format badge (best-of or "casual") · ball-type
  dot · venue. Row → `/matches/[id]`.
- **States:** empty → `Empty`; long history → pagination.

#### `/matches/[id]` — match detail
- **Purpose:** the deep-drill target — one match told in full; where "show me the rallies" lands.
- **Layout:**
  1. Header — date, venue, ball type, format; both players with final games score; match winner
     emphasised (or "casual session" tally).
  2. **Game strip** — one card per game (`11–9`, `7–11`, …), winner-tinted; selecting a game scrolls
     to / expands its timeline.
  3. **Per-game rally timeline** — the signature drill view: a vertical two-sided timeline (player A
     events left, player B right, mirroring the logger), each rally a compact row: running score ·
     end-reason icon + label · serve side/number chips · shot count. Lets render as neutral hash-marks.
     A **momentum strip** (the diverging area chart) runs alongside each game.
  4. Rally click → `Sheet` with full detail (all fields, prev/next navigation). Deep-linkable
     (`?rally=…`) so category-page drills can highlight a specific rally.
- **Owner extras:** an **"Edit match"** button (reopens the match in the logger to append games or fix
  rallies) + discreet "edit in manage" links per game/rally for surgical field edits.
- **Components:** `Card`, `Badge`, `Table`, `Chart` (momentum strip), `Sheet`, `Breadcrumb`, `Empty`.



### 5.3 Login & entry portal (the logger)

#### `/login`
- shadcn login block: email + password (owner account only), `Field` composition, error state, redirect
  to `/entry`. No sign-up flow. A route guard (`beforeLoad` on the `/entry` route) redirects
  unauthenticated visits to `/login`.

#### `/entry` — the logger (single stateful screen)
**Layout inspiration: Score Squash** — two player columns with the score huge at the top, a rally
timeline running down the centre, and big action targets under each player. We keep that skeleton and
extend it for our richer per-rally data. Super simple, clean, generous tap targets.

**Phase A — match setup:**
- **New match:** compact form — players (two `Combobox`es + inline "new player"), date (default
  today), venue, format (casual/Bo3/Bo5), ball type, tiebreak, **who serves first**. Client-validated
  (two *distinct* players required; the DB CHECK backstops). → Start logging.
- **Edit an existing match:** a recent-matches list; picking one reopens it in the logger to append
  games/rallies or fix entries. **There is no "in progress" state — every match is considered
  finished as logged**, and editing is always available. (Also reachable from `/matches/[id]` via an
  owner-only "Edit match" button.)

**Phase B — logging (the screen that matters):**

```
┌──────────────────────── game 2 · casual · double yellow ───────────────────────┐
│      SAM                        rally list                          DAVE       │
│       10  ● serving              9  W  tin →                          3        │
│    (left box · 1st)              8  ← ace                                      │
│                                  7  L  let (hash)                              │
│                                          …                                     │
│  [ SAM WON RALLY ]                                        [ DAVE WON RALLY ]   │
│                                                                                │
│  how: [winner][error][stroke][ace][serve fault]      + [let]                   │
│  error detail (if error): [tin][out top][out side][out back][not up][dbl bounce]│
│  forced? [y/n]   shot type (optional)   shots: [__]                            │
│                                  [ SAVE ]      [ undo last ]                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

- **Header:** giant tabular score, serving player marked with a dot + suggested box/serve-number chips
  — **all tappable to override, including the server dot itself**. Game 1's first server comes from
  setup; each later game defaults to the previous game's winner (editable). Score is derived from
  logged rallies; server context is always a *suggestion*, stored as fact on save.
- **Primary action = who won:** two big buttons, one per player (Score Squash's "WON RALLY"). A third
  slim **let** button sits between — a let **saves immediately** with the current serve context (one
  tap, no chips; fixable afterwards in the timeline like any rally).
- **Secondary chips appear after the winner tap:** end-reason `ToggleGroup` (winner · error · stroke ·
  ace · serve fault); if *error*/*serve fault*, the error-detail chip row + forced toggle appear;
  optional shot-type; `shot_count` numeric input. Save → row appended, chips reset, winner cleared,
  focus returns. Context (game, server, sides) sticks.
- **Hotkeys** (buttons remain for discoverability): `s`/`d` = winner on the **left/right side of the
  screen** (court positions, not initials — generalises to any opponent) · `l` = let · `w/e/k/a/f` =
  winner/error/stroke/ace/fault · `t/o/i/b/n/x` = error details · `g` = forced toggle · `q` = toggle
  1st/2nd serve · `z` = toggle serve box · digits = shot count · `enter` = save · `u` or `cmd+z` =
  undo · `?` = hotkey cheat-sheet overlay.
- **Serve-fault consistency:** selecting *serve fault* auto-sets serve number to 2 (under the two-serve
  house rule a point can only *end* on a second-serve fault — a first-serve fault just means the point
  is played on the second serve, toggled with `q`). The DB enforces the same rule (§7).
- **Centre rally timeline:** newest at top, two-sided (each rally on its winner's side), running score,
  end-reason icon, serve chips. Click any row → inline edit (fix mistakes before/after save). This is
  the same visual language as the match-detail timeline (§5.2).
- **Undo:** one action pops the last rally (with toast + redo grace). Works across a game boundary:
  deleting game N's last rally also **deletes the now-empty game N+1 row** in the same transaction
  (no orphan games). Redo re-inserts as a fresh row with the same rally_number.
- **Optimistic save (online-only), strict FIFO:** rows append to local state instantly, but writes go
  to Supabase through an **ordered queue** — rally *n+1* is not sent until rally *n* is confirmed, and
  a new game's row commits before its rallies (no out-of-order holes that would silently shift every
  derived score). Rally ids are **client-generated UUIDs** so a timeout-then-retry is idempotent
  (unique-violation on retry = success). Transient failures retry; a **permanent failure hard-pauses
  the form** with the same banner as connection loss — never log past a hole. Sync status stays visible
  (`synced ✓ / syncing… / paused`). **Every logger write — saves, undo deletes, inline edits, game
  creation — flows through the same queue**, so an undo can never race its own rally's in-flight insert.
- **Game/match end:** when the derived score crosses the target (respecting win-by-2 / sudden-death
  hint), a banner proposes "End game — start game N+1" (server carries per your real play, editable) or
  "Finish match" → summary card (Score Squash-style: games list with scores) → links to `/matches/[id]`.
- **Components:** `Card`, `ToggleGroup`, `Combobox`, `Field`, `Input`, `Button`, `Sonner`, `Drawer`
  (rally edit), `Badge`, `Kbd`-style hint chips.
- **States:** reload-safe (state re-hydrates from the DB — every saved rally is already there),
  mid-session pause ("pause & exit", resumable from Phase A), connection lost (paused banner, resume
  on reconnect).



### 5.4 Manage / edit views

#### `/manage`
- **Purpose:** the raw data browser and (when logged in) the edit surface. Public to view; all write
  affordances appear only for the authenticated owner (RLS enforces regardless).
- **Layout:** `Tabs` — Matches · Games · Rallies · Players. Each tab is a dense, sortable, filterable
  `Table` of the raw records (all columns), with a search/filter row. Relations are clickable (a game
  links to its match; a rally to its game).
- **Owner editing:** row actions (edit in a `Sheet` form via `Field` composition, delete with
  `AlertDialog` confirm; deletes cascade per schema), plus **"insert missed rally at position k"** on
  the Rallies tab — renumbers later rallies in one transaction (the unique constraint is `DEFERRABLE`
  for exactly this). Editing a rally auto-recomputes score/results everywhere — no manual fixing (the
  §7 derive-don't-store payoff).
- **Validation honesty:** the edit form surfaces DB constraint errors plainly (e.g. let ⇔ no winner,
  player-not-in-match trigger).
- **Components:** `Tabs`, `Table`, `Sheet`, `AlertDialog`, `Field`, `Input`/`Select`, `Sonner`,
  `Pagination`.
- **States:** `Skeleton` rows while a tab loads; failed fetch → inline retry card; failed mutation →
  error toast with the row left visibly dirty (never silently reverted).



---

## 6. Component library & data-to-UI mapping

Principle: a small set of domain components, built once, reused everywhere — each fed by exactly one
view/RPC so there's never a question of where a number comes from.

### 6.1 Domain components

| Component | What it is | Used on | Fed by |
|---|---|---|---|
| `StatCard` | number + label + **denominator built in** ("62% · 15 of 22") + optional mini-viz; built-in "not enough data (n=X)" state — §3.5 enforced by design | everywhere | any RPC |
| `PlayerCard` | roster card: name, win rate, form sparkline, W–L (**all game-level**, decided games only) | home, compare picker | `players_headline()` batch RPC (`recent_results` = last N game results, date + created_at order) |
| `CourtDiagram` | SVG court, service boxes shaded by win % — signature motif; doubles as empty-state art + wordmark | serve pages, empties, brand | `serve_stats` |
| `RallyTimeline` | two-sided vertical rally list (winner's side, running score, end-reason icon, serve chips, lets as hash-marks). **One component, two modes:** editable (logger) / read-only (match detail) | logger, match detail | `rallies_scored` / local queue |
| `MomentumChart` | diverging area chart of a game's lead | match detail, momentum page, summary | `momentum` RPC (player pages); computed client-side from the already-fetched `rallies_scored` rows on match detail / in the logger |
| `GameCard` | one game's score chip, winner-tinted | match detail, summary | `game_results` |
| `MatchRow` | date · players · score · format/ball badges | home, /matches | `match_results` |
| `FilterBar` | opponent · ball · date range; **state lives in the URL** (`?vs=…&ball=…`) so filters persist across pages and every filtered view is shareable | player + category pages | drives RPC params |
| `ErrorBreakdown` | stacked bar of error types + forced split | errors page, compare | `error_profile` |
| `RallyLengthHisto` | length buckets with win-rate per bucket | rallies page, compare | `rally_lengths` |
| `WinRateTrend` | win-rate-over-time line (points-only under §3.5 threshold) | h2h page, player header | `h2h` |
| `RallyDetailSheet` | slide-over with a rally's full fields + prev/next | match detail, drills, manage | row data |

### 6.2 Logger-only components

`ScoreHeader` (giant tabular score, serving dot, box/serve chips) · `WinnerButtons` (two big buttons +
let) · `OutcomeChips` (end-reason → conditional detail/forced/shot-type/count) · `SyncIndicator` ·
`HotkeyHelp` (`?` overlay).

### 6.3 Straight from shadcn

Table, Tabs, Sheet, Dialog/AlertDialog, Combobox, ToggleGroup, Field/FieldGroup, Sonner, Skeleton,
Empty, Breadcrumb, Badge, Card, top-bar nav block, login block, Pagination, Command.

---

## 7. Database design ✅

> **Complete.** Rallies are the source of truth; running score, game winner, and match winner are all
> *derived via views* — never stored — so editing any rally recomputes everything downstream. No
> migrations have been applied yet; this is the plan of record.

### 7.1 Design principles

1. **Rallies are the source of truth.** Score, server context, game winner, match winner are derived.
2. **Derive via views, not stored columns** — so edits self-heal and nothing drifts.
3. **Rule-agnostic game/match resolution.** The game winner is "whoever leads at the last rally
   actually played" — supports both win-by-2 and sudden-death with zero rule-specific code.
4. **Lean, fast-to-tag rally rows.** Every column is something that may be entered while reviewing
   footage. Optional/advanced fields are nullable and never required.
5. **Constraints over good intentions.** The most likely data-entry bug (a rally saved with the
   wrong/no winner) is blocked by a CHECK constraint.

### 7.2 Data model

```
players ──< matches >── players        (a match links two players)
              │
              └──< games ──< rallies   (match has games; game has rallies)
```

- **match** = a session of games between two players on a date. Best-of format is *optional*.
- **game** = one race to 11, win by 2 (or sudden-death). Just groups & orders rallies.
- **rally** = one point. The atomic unit; everything is derived from these.

FKs live on the child pointing up. Deleting a match cascades to its games and rallies.

**players** — `id` uuid PK · `name` text · `handedness` enum(left/right) nullable · `created_at`/`updated_at`.

**matches** — `id` · `date` · `player1_id`/`player2_id` (FK players, must differ) · `venue` nullable ·
`format` smallint nullable (null=casual, 3/5=best-of) · `target_score` smallint default 11 ·
`tiebreak` enum(win_by_2/sudden_death) default win_by_2 (form hint only) · `ball_type` enum nullable
(blue/red/yellow/double_yellow) · `notes` nullable · timestamps.

**games** — `id` · `match_id` (FK, cascade) · `game_number` smallint (unique within match) · timestamps.

**rallies** (the heart) — `id` · `game_id` (FK, cascade) · `rally_number` (unique within game) ·
`server_id` (FK players, **stored, never derived**) · `serve_side` enum(left/right) ·
`serve_number` smallint(1/2) · `winner_id` (FK players, **null ONLY for lets**) · `end_reason` enum ·
`error_detail` enum nullable · `forced` bool nullable (errors only) · `shot_type` enum nullable
(winner/ace only) · `shot_count` smallint nullable · timestamps.

**Enums**
- `end_reason`: winner · error · stroke · let · ace · serve_fault
- `error_detail`: tin · out_top · out_side · out_back · not_up · double_bounce
- `serve_side`: left · right
- `shot_type`: drop · drive · kill · nick · boast · volley · lob · other
- `handedness`: left · right
- `tiebreak`: win_by_2 · sudden_death
- `ball_type`: blue · red · yellow · double_yellow  (bounce → difficulty: blue easiest, double_yellow hardest)

**Conventions & invariants**
- Error-maker = the player who is NOT `winner_id` (for error/serve_fault). Stroke/let are not errors.
- Lets: `winner_id IS NULL`, no score change, but still get a `rally_number`; excluded from
  running-score & streak logic, still countable for let-frequency.
- Ace explicit (`end_reason='ace'`, winner = server). Double fault = `serve_number=2 AND serve_fault`.
- **A point can only end on a serve fault on the second serve** (two-serve house rule) — so
  `serve_fault ⇒ serve_number = 2`, enforced by CHECK and auto-set in the logger.
- **Lets don't reset serves** (house rule): the replayed point keeps the same `serve_number`. This rule
  lives ONLY in the logger's suggested default — the DB just stores what happened — so if the house
  rule ever changes, it's a one-line default change, no schema or data impact.
- `not_up` = hit it but didn't reach the front wall (short); `double_bounce` = didn't get to the ball.
- **Edits never cascade serve context.** The match already happened; editing a rally's winner corrects
  *what was recorded*, not what physically followed — stored `server_id`/`serve_side` on later rallies
  stay exactly as logged. Only *derived* values (score, game/match winners) recompute.
- **First server is asked, never assumed:** match setup asks who serves first; each later game
  *defaults* to the previous game's winner but is a tappable, editable suggestion (consistent with
  "server is stored, never derived").
- **`shot_count` semantics:** total shots in the rally *including the serve* — ace = 1, double fault
  = 0. NULL = untagged; untagged rallies are excluded from all rally-length stats and thresholds.
- **`forced` semantics:** only on `end_reason='error'`; NULL = untagged and excluded from the
  forced/unforced split (reported as "untagged", never lumped into either side).
- **A match's players are immutable once it has games** (trigger-enforced) — changing them would
  silently orphan every rally's winner/server mapping.
- CHECK-enforced: let ⇔ null winner (biconditional); `error_detail` only on error/serve_fault;
  serve_fault ⇒ 2nd serve; ace ⇒ winner = server; serve_fault ⇒ winner = receiver; `forced` only on
  errors; `shot_type` only on winner/ace; `player1 <> player2`; `format in (3,5)` or null.

### 7.3 SQL — migration files

Four migrations under `supabase/migrations/`: the three below (validated, production-correct Postgres,
Supabase PG15+) plus `0004_insight_rpcs.sql` (specified in §8.4, written in Phase 5).

#### `0001_enums_and_tables.sql`

```sql
create extension if not exists pgcrypto;

create type handedness   as enum ('left', 'right');
create type tiebreak     as enum ('win_by_2', 'sudden_death');
create type ball_type    as enum ('blue', 'red', 'yellow', 'double_yellow');
create type serve_side   as enum ('left', 'right');
create type end_reason   as enum ('winner', 'error', 'stroke', 'let', 'ace', 'serve_fault');
create type error_detail as enum ('tin', 'out_top', 'out_side', 'out_back', 'not_up', 'double_bounce');
create type shot_type    as enum ('drop', 'drive', 'kill', 'nick', 'boast', 'volley', 'lob', 'other');

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(btrim(name)) > 0),
  handedness  handedness,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.matches (
  id            uuid primary key default gen_random_uuid(),
  date          date not null default current_date,
  player1_id    uuid not null references public.players(id) on delete restrict,
  player2_id    uuid not null references public.players(id) on delete restrict,
  venue         text,
  format        smallint check (format in (3, 5)),
  target_score  smallint not null default 11 check (target_score > 0),
  tiebreak      tiebreak not null default 'win_by_2',
  ball_type     ball_type,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint matches_distinct_players check (player1_id <> player2_id)
);

create table public.games (
  id           uuid primary key default gen_random_uuid(),
  match_id     uuid not null references public.matches(id) on delete cascade,
  game_number  smallint not null check (game_number > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint games_match_number_uniq unique (match_id, game_number)
);

create table public.rallies (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.games(id) on delete cascade,
  rally_number  smallint not null check (rally_number > 0),
  server_id     uuid not null references public.players(id) on delete restrict,
  serve_side    serve_side not null,
  serve_number  smallint not null check (serve_number in (1, 2)),
  winner_id     uuid references public.players(id) on delete restrict,
  end_reason    end_reason not null,
  error_detail  error_detail,
  forced        boolean,
  shot_type     shot_type,
  shot_count    smallint check (shot_count is null or shot_count >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- deferrable so a mid-game "insert missed rally" can renumber inside one transaction
  constraint rallies_game_number_uniq unique (game_id, rally_number) deferrable initially immediate,
  constraint rallies_let_null_winner check ((end_reason = 'let') = (winner_id is null)),
  constraint rallies_error_detail_scope check (
    error_detail is null or end_reason in ('error', 'serve_fault')
  ),
  constraint rallies_fault_second_serve check (
    end_reason <> 'serve_fault' or serve_number = 2
  ),
  constraint rallies_ace_winner_serves check (end_reason <> 'ace' or winner_id = server_id),
  constraint rallies_fault_receiver_wins check (end_reason <> 'serve_fault' or winner_id <> server_id),
  constraint rallies_forced_scope check (forced is null or end_reason = 'error'),
  constraint rallies_shot_type_scope check (shot_type is null or end_reason in ('winner', 'ace'))
);

create index matches_player1_idx on public.matches (player1_id);
create index matches_player2_idx on public.matches (player2_id);
create index matches_date_idx    on public.matches (date);
create index games_match_idx     on public.games   (match_id);
create index rallies_game_idx    on public.rallies (game_id);
create index rallies_server_idx  on public.rallies (server_id);
create index rallies_winner_idx  on public.rallies (winner_id);

create trigger players_set_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches
  for each row execute function public.set_updated_at();
create trigger games_set_updated_at before update on public.games
  for each row execute function public.set_updated_at();
create trigger rallies_set_updated_at before update on public.rallies
  for each row execute function public.set_updated_at();

create or replace function public.rallies_validate_players()
returns trigger language plpgsql as $$
declare p1 uuid; p2 uuid;
begin
  select m.player1_id, m.player2_id into p1, p2
  from public.games g join public.matches m on m.id = g.match_id
  where g.id = new.game_id;

  if new.server_id not in (p1, p2) then
    raise exception 'server_id % is not a player in this match', new.server_id;
  end if;
  if new.winner_id is not null and new.winner_id not in (p1, p2) then
    raise exception 'winner_id % is not a player in this match', new.winner_id;
  end if;
  return new;
end;
$$;
create trigger rallies_validate_players before insert or update on public.rallies
  for each row execute function public.rallies_validate_players();

-- players are immutable once the match has games (silent-corruption guard: changing them would
-- orphan every rally's winner/server mapping in the derived views)
create or replace function public.matches_validate_player_change()
returns trigger language plpgsql as $$
begin
  if (new.player1_id <> old.player1_id or new.player2_id <> old.player2_id)
     and exists (select 1 from public.games g where g.match_id = new.id) then
    raise exception 'cannot change players on a match that already has games';
  end if;
  return new;
end;
$$;
create trigger matches_validate_player_change before update on public.matches
  for each row execute function public.matches_validate_player_change();
```

#### `0002_views.sql`

> **All views are `security_invoker = true`** — without it, views run as owner and **bypass RLS**.

```sql
create view public.rallies_scored with (security_invoker = true) as
select
  r.id, r.game_id, g.match_id, g.game_number, r.rally_number,
  m.player1_id, m.player2_id, m.date, m.ball_type, r.server_id,
  case when r.server_id = m.player1_id then m.player2_id
       when r.server_id = m.player2_id then m.player1_id end as receiver_id,
  r.winner_id, r.end_reason, r.error_detail, r.forced, r.shot_type,
  r.serve_side, r.serve_number, r.shot_count,
  (r.end_reason = 'let') as is_let,
  sum(case when r.winner_id = m.player1_id then 1 else 0 end)
      over (partition by r.game_id order by r.rally_number
            rows between unbounded preceding and current row) as score_p1,
  sum(case when r.winner_id = m.player2_id then 1 else 0 end)
      over (partition by r.game_id order by r.rally_number
            rows between unbounded preceding and current row) as score_p2
from public.rallies r
join public.games   g on g.id = r.game_id
join public.matches m on m.id = g.match_id;

create view public.game_results with (security_invoker = true) as
select distinct on (rs.game_id)
  rs.game_id, rs.match_id, rs.game_number, rs.player1_id, rs.player2_id,
  rs.date, rs.ball_type, rs.score_p1, rs.score_p2,
  case when rs.score_p1 > rs.score_p2 then rs.player1_id
       when rs.score_p2 > rs.score_p1 then rs.player2_id end as winner_id,
  (rs.score_p1 = rs.score_p2) as is_undecided
from public.rallies_scored rs
order by rs.game_id, rs.rally_number desc;

create view public.match_results with (security_invoker = true) as
with game_wins as (
  select gr.match_id, gr.winner_id
  from public.game_results gr
  where gr.winner_id is not null
)
select
  m.id as match_id, m.player1_id, m.player2_id, m.format,
  m.date, m.venue, m.ball_type, m.target_score,
  count(*) filter (where gw.winner_id = m.player1_id) as games_won_p1,
  count(*) filter (where gw.winner_id = m.player2_id) as games_won_p2,
  case
    when m.format is not null then
      case
        when count(*) filter (where gw.winner_id = m.player1_id) >= (m.format / 2 + 1) then m.player1_id
        when count(*) filter (where gw.winner_id = m.player2_id) >= (m.format / 2 + 1) then m.player2_id
      end
    else
      case
        when count(*) filter (where gw.winner_id = m.player1_id)
           > count(*) filter (where gw.winner_id = m.player2_id) then m.player1_id
        when count(*) filter (where gw.winner_id = m.player2_id)
           > count(*) filter (where gw.winner_id = m.player1_id) then m.player2_id
      end
  end as match_winner_id
from public.matches m
left join game_wins gw on gw.match_id = m.id
group by m.id, m.player1_id, m.player2_id, m.format, m.date, m.venue, m.ball_type, m.target_score;

create view public.errors_attributed with (security_invoker = true) as
select
  r.id as rally_id, r.game_id, g.match_id, r.rally_number,
  r.end_reason, r.error_detail, r.forced, r.winner_id,
  case when r.winner_id = m.player1_id then m.player2_id
       when r.winner_id = m.player2_id then m.player1_id end as error_maker_id
from public.rallies r
join public.games   g on g.id = r.game_id
join public.matches m on m.id = g.match_id
where r.end_reason in ('error', 'serve_fault');
```

#### `0003_rls_policies.sql`

Public read; owner-only writes. Owner identity via an `app_admins` table (no magic UUIDs).

```sql
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
-- seed once:  insert into public.app_admins (user_id) values ('<your-auth-uid>');

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins a where a.user_id = (select auth.uid()));
$$;

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.games   enable row level security;
alter table public.rallies enable row level security;

create policy players_read on public.players for select to anon, authenticated using (true);
create policy matches_read on public.matches for select to anon, authenticated using (true);
create policy games_read   on public.games   for select to anon, authenticated using (true);
create policy rallies_read on public.rallies for select to anon, authenticated using (true);

create policy players_ins on public.players for insert to authenticated with check ((select public.is_owner()));
create policy players_upd on public.players for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy players_del on public.players for delete to authenticated using ((select public.is_owner()));
create policy matches_ins on public.matches for insert to authenticated with check ((select public.is_owner()));
create policy matches_upd on public.matches for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy matches_del on public.matches for delete to authenticated using ((select public.is_owner()));
create policy games_ins on public.games for insert to authenticated with check ((select public.is_owner()));
create policy games_upd on public.games for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy games_del on public.games for delete to authenticated using ((select public.is_owner()));
create policy rallies_ins on public.rallies for insert to authenticated with check ((select public.is_owner()));
create policy rallies_upd on public.rallies for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy rallies_del on public.rallies for delete to authenticated using ((select public.is_owner()));

create policy admins_read on public.app_admins for select to authenticated using ((select public.is_owner()));
```

> **Supabase note:** RLS controls *rows*; the Data API grant controls *table reachability*. Confirm
> `anon`/`authenticated` have `select` on tables + views.

### 7.4 Insights the schema unlocks

All pure SQL over the views — no schema changes needed: head-to-head (`match_results`/`game_results`),
error profile (`errors_attributed`), serve stats (aces, faults, double faults, serve-side, 1st/2nd),
phases of play (score-band slices of `rallies_scored`, analysis-time only), comebacks (window over the
running score), streaks (gaps-and-islands over `winner_id`), rally length (`shot_count`).

### 7.5 Known limitations / accepted tradeoffs

- The model has no "in progress" concept — **by convention every match is finished as logged** and can
  always be reopened/appended via the logger (`is_undecided` still flags a game whose last rally left
  it tied).
- Score sanity-check catches *missed* rallies, not *mis-tagged* winners (mitigated by edit + trigger).
- Small samples are noisy — dashboard must show counts beside rates.
- No tactical/spatial data — v1 is outcome & sequence analytics; `shot_type` is the one tactical hook.

### 7.6 Verification (when applied)

Insert a fixture (2 players, 1 match, 1 game, rallies incl. a let & a double fault), then assert
`rallies_scored` (let row carries prior score), `game_results` (leader + `is_undecided`),
`match_results` (tally respects format), `errors_attributed` (error mapped to non-winner; double
fault = the `serve_fault` row); confirm all §7.2 CHECKs and both triggers reject bad rows (null-winner
non-let, ace with non-server winner, player change on a match with games, out-of-match player);
confirm RLS (anon reads, only owner writes).

---

## 8. Tech architecture

### 8.1 Stack

- **TanStack Start** (React + TypeScript on Vite; TanStack Router + Query as first-class citizens),
  scaffolded via `npx shadcn@latest create --template start --preset b4aRKOtyXC`.
- **Supabase** (Postgres + auth + client libs). **Cloud project from day one**; local Supabase copies
  (CLI/Docker) introduced later once real data exists and needs protecting.
- **TanStack Query everywhere** — one data paradigm, client and server; **Recharts** via shadcn
  `Chart`; **Cloudflare Workers** hosting (free tier; official TanStack partner; SSR in workerd via
  the Cloudflare Vite plugin).

**Why Start (recorded rationale):** one mental model instead of Next's RSC/client split; explicit
caching via Query (`staleTime`) instead of layered framework caches; **typed search params** (the
FilterBar's `?vs=…&ball=…` URLs are type-safe, §6.1); client-first so it matches existing React +
TanStack Query fluency; low exit cost (≈ a Vite SPA if we ever drop SSR).

### 8.2 App structure

```
src/
  routes/
    __root.tsx              shell: top bar, providers
    index.tsx               home hub
    players.$playerId.tsx   player overview
    players.$playerId.$category.tsx
    compare.tsx · matches.index.tsx · matches.$matchId.tsx · manage.tsx
    login.tsx
    entry.tsx               the logger (beforeLoad auth guard)
  lib/
    supabase/               browser + server clients (@supabase/ssr, cookie sessions)
    queries/                all reads: queryOptions per view/RPC, one place
    scoring/                logger-only live logic (score, server suggestion, game-over) — pure TS, unit-tested
  components/
    ui/ (shadcn) · charts/ · court/ · rally-timeline/ · logger/
supabase/migrations/        0001 tables · 0002 views · 0003 RLS · 0004 insight RPCs
```

URL paths are unchanged from §2.1 (`/players/[id]` etc. — `$param` is just Start's file convention).

### 8.3 Data strategy — one paradigm

**Everything is TanStack Query.** Route loaders prefetch the same `queryOptions` on the server (SSR,
no first-paint skeleton on public pages); components read them with `useQuery`; freshness is explicit
per-query `staleTime` (default **30s** on dashboard reads — the §8.3 cache policy, now visible in code
instead of a framework layer).

| Surface | Pattern |
|---|---|
| Public dashboard (reads) | Route loader prefetches → SSR'd HTML → Query keeps it fresh client-side (`staleTime: 30s`) |
| Logger `/entry` (writes) | Query mutations: optimistic append to local state; background writes through a **strict FIFO queue** with client-generated UUIDs (idempotent retries; permanent failure hard-pauses — §5.3). **Online-only**; reload re-hydrates from the DB |
| Manage (edits) | Query mutations with invalidation; edits recompute everything downstream automatically (derived model) |

### 8.4 Where stats are computed — RPC-per-insight

- **Every analytical stat is computed in Postgres**: the §7 views for the fundamentals, plus **one RPC
  (Postgres function) per insight** — `player_headline(player_id, …)` (win rate over decided games,
  record, recent game results in date+created_at order, signature trait), `serve_stats(…)` (per the
  §3.3.2 pinned derivations), `error_profile(…)`, `rally_lengths(…)`, `momentum(…)` (per the §3.3.5
  pinned definitions), `h2h(…)` — added as migration `0004`. A `players_headline()` batch variant
  feeds the home roster in one call (no per-card N+1).
- **Drill-through has a first-class data path:** each drillable stat gets a `*_rallies(…)` companion
  RPC that returns the underlying rally rows using the *same* WHERE logic as its aggregate (shared SQL
  helper functions), so the L2 "underlying rallies" table (§5.1) can never drift from the number above
  it. The client never re-implements a stat's filter.
- RPCs take the cross-cutting filters (§3.6) as parameters: `opponent_id`, `ball_type`, `date_from/to`.
  Front-end calls `supabase.rpc(...)` and renders the finished numbers. One source of truth; thin client.
- RPCs are `security invoker`, read-only, `execute` granted to `anon`/`authenticated`, and return
  denominators alongside every rate (§3.5).
- **Sole exception:** the logger's live score / server-suggestion / game-over detection runs between
  keystrokes, so it lives in `lib/scoring/` TS (mirroring the SQL semantics; unit tests pin the two
  implementations together — same fixtures as §7.6).

### 8.5 Auth

- `@supabase/ssr` cookie sessions (Supabase documents the TanStack Start integration); email+password,
  owner account only (seeded in `app_admins`).
- The `/entry` route's **`beforeLoad`** guard redirects unauthenticated visits → `/login`. All other
  routes public.
- Writes are authorised by **RLS**, not the guard — even a leaked route can't mutate data.

### 8.6 Types & env

- `supabase gen types typescript` → `src/lib/database.types.ts`, regenerated after each migration;
  both Supabase clients and RPC calls are fully typed against it.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public-safe by design; RLS gates writes). No
  service-role key in the app.

### 8.7 Test strategy — risk-weighted

A small suite aimed at the failure modes that would *silently corrupt data or numbers* — not coverage
theatre. Tooling: **Vitest** (+ Testing Library) for unit/component; **Playwright** for one golden
path; plain SQL fixtures for the DB.

| Risk (ranked) | Failure mode | Test |
|---|---|---|
| **1. Derivation correctness** (views + RPCs) | every dashboard number silently wrong | **SQL fixture tests**: seeded games covering lets mid-game, 13–11 win-by-2, sudden death, undecided/tied, casual vs best-of, double faults → assert `rallies_scored`/`game_results`/`match_results`/RPC outputs row-by-row. Run against a **disposable local Supabase** (or rollback-wrapped transactions) — never the cloud project |
| **2. TS ↔ SQL parity** | logger shows 8–6, DB derives 7–7 | **shared golden fixtures** (JSON rally sequences + expected scores) consumed by *both* the `lib/scoring` Vitest suite and the SQL fixture tests — one source of expected truth |
| **3. FIFO write queue** | silent holes / duplicate rallies | **Vitest with a mocked Supabase client**: out-of-order confirmation, timeout-then-retry (unique-violation = success), permanent failure ⇒ hard-pause, undo queued behind its own in-flight insert, game-row-before-rallies |
| **4. Logger state machine** | wrong data captured at speed | **component/unit tests**: fault⇒serve-2 auto-set, ace⇒server-wins, let saves immediately with context, chip-flow conditionals, hotkey map, undo across game boundary |
| **5. RLS** | strangers can write | scripted check (anon insert rejected / owner accepted) as part of Phase 1 verification |
| **6. Golden path** | it all works together | **one Playwright E2E**: log a short match through the real UI → assert the rows in the DB → assert the match page renders it |

Explicitly *not* tested: chart rendering, shadcn internals, visual styling — low risk, high maintenance.
CI runs 2–4 + 6 on every push (no DB dependency for 2–4); SQL fixture tests run locally when the
schema or an RPC changes.

### 8.8 Deployment

- **Cloudflare Workers** (free tier) + **Supabase cloud** free tier. TanStack Start runs as a Worker
  via the `@cloudflare/vite-plugin`; **Workers Builds** connects the GitHub repo for auto-deploy from
  `main` and preview URLs per branch/PR. (Cloudflare Pages is deprecated for new full-stack apps —
  Workers is the current official path.) Migrations applied via `supabase db push` (or MCP
  `apply_migration`) against the cloud project. Preview deploys share the same project until local
  stacks are introduced.

---

## 9. Build roadmap & milestones

Guiding rule (from the original spec): **schema → logger → dogfood real data → dashboard.**

| Phase | Deliverable | Done when |
|---|---|---|
| **0 — Scaffold** | `shadcn create --template start` app (preset `b4aRKOtyXC`), repo layout per §8.2, Supabase clients + env, deploy pipeline to Cloudflare Workers | app boots locally & on Cloudflare with themed shell + nav |
| **1 — Schema** | Migrations 0001–0003 applied to cloud project; owner seeded; types generated; **SQL fixture tests written (§8.7 #1) + RLS check (#5)** | §7.6 verification + fixture tests pass; anon can read, only owner can write |
| **2 — Logger** | `/login` + `/entry` complete per §5.3 (setup, big-button entry, chips, hotkeys, undo, optimistic sync, timeline, game/match end) + **tests §8.7 #2–4 (scoring parity, FIFO queue, state machine) and the Playwright golden path (#6)** | tests green; a full real match can be logged end-to-end, survives reload, lands correctly in the DB |
| **3 — Dogfood** | Sam logs 1–2 real sessions | real data in prod; logger friction notes filed and fixed |
| **4 — Manage** | `/manage` tables + owner editing per §5.4 | any record can be found, edited, deleted; derived stats recompute |
| **5 — Insight RPCs** | Migration 0004: `player_headline(s)`, `serve_stats`, `error_profile`, `rally_lengths`, `momentum`, `h2h` + `*_rallies` companions (+ filters) | **SQL fixture tests extended to every RPC** (§8.7 #1, incl. filter params + denominators); numbers spot-checked against the real logged data |
| **6 — Dashboard** | Home, player overview, category pages, compare, matches/history per §5.1–5.2, built on the real data | every §3.3 insight renders with real numbers; drill-through works L1→L4 |
| **7 — Polish** | Motion, empty states, court motif everywhere, responsive & a11y pass (§10), OG/meta for sharing | portfolio-ready: shareable links look great, no dead ends |

Phases ship in order; each is independently reviewable by Sam ("build → refine" loop).

### 9.1 Commit & branch discipline (portfolio-grade history)

The history must read as incremental, deliberate work — never machine-paced dumps.

- **Build in commit-sized units:** implement one logical change → verify build/tests → commit → next.
  Never build a whole phase and split the diff afterwards.
- **One commit = one reviewable idea;** if the subject needs "and", split it. Typical size ~30–150
  lines. Honest exceptions: the scaffold and shadcn component-adds (recognisably generated).
- **Every commit leaves the repo working** (builds + tests green) — history stays bisectable.
- **Messages:** conventional-lite (`feat(db): …`, `test(scoring): …`, `fix(logger): …`), imperative
  mood, short *why* body when not obvious. Tests land adjacent to the code they cover.
- **The plan is the first commit;** amendments are `docs:` commits alongside the phase that caused them.
- **Issue-driven:** work is organised as GitHub issues — one issue = one PR-sized chunk (2–8 commits),
  written as Problem/Context · Proposed solution · Notes · Acceptance criteria, labelled `phase:N` +
  topic, grouped by a milestone per phase. Issues are drafted one phase ahead (just-in-time), and Sam
  chooses which issue to start and merges each PR.
- **Branches:** short-lived branch per issue (`4-derived-views`) → PR (`Closes #4`, approach summary)
  → **rebase-merge** for linear history.
- Example grain — Phase 1 is ~4 issues / ~8 commits (enums/trigger · players+matches ·
  games+rallies+checks · scoring views · results views · RLS · fixture tests · typegen), not one dump.
- Commits carry the `Co-Authored-By: Claude` trailer (decided 2026-07).

---

## 10. Cross-cutting concerns

- **Responsive:** dashboard fully responsive (roster grid collapses, timelines stay legible on mobile).
  The logger is **desktop-first** (it lives beside footage) but degrades gracefully to tablet; mobile
  logging is out of scope for v1.
- **Accessibility:** full keyboard operability (the logger already is, by design); visible focus;
  `aria` labels on icon-only controls; charts get text alternatives (the denominator text doubles as
  the accessible summary); shadcn primitives carry the rest. Contrast per the preset's tokens.
- **Empty/early data:** every surface has a designed empty state (`Empty` + court motif); §3.5
  small-sample rules everywhere; the app must look *good*, not broken, with 0–2 matches logged.
- **Performance:** trivially small data + SSR loaders + 30s `staleTime` ≈ nothing to do; keep charts
  code-split (lazy route/component imports) so the public pages stay light; Lighthouse pass in Phase 7.
- **Integrity:** DB constraints surface as friendly form errors (§5.4); failed background saves retry
  and surface clearly; `updated_at` audit via triggers.
- **Failure & not-found states:** every route has an **error boundary** (friendly "couldn't load" +
  retry via Query refetch — never a blank section or white screen); a failed individual query renders
  an inline retry card in its slot. **Unknown player/match ids render a designed 404** (court motif +
  link home). Login failures show the shadcn error state (§5.3).
- **Concurrency model (stated, not hidden):** single owner, one active logging session assumed.
  Logging the same match from two tabs isn't supported — the `(game_id, rally_number)` unique
  constraint rejects the second writer and the FIFO hard-pause surfaces it immediately rather than
  merging silently. Public readers are unaffected (30s-stale reads by design).
- **SEO/sharing:** public pages get proper titles + OG images (court motif + headline stat) — it's a
  portfolio piece; links should unfurl nicely.
