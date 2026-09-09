# Architecture

How the frontend is organised, and the one rule that keeps it that way. For the _why_, see
[decisions.md #14](decisions.md). The plan of record is [PROJECT_PLAN.md](../PROJECT_PLAN.md) §8.2.

## The shape

Feature-based, following [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master/apps/react-vite).
Code is grouped by _what it's for_, not by _what kind of thing it is_.

```
src/
  routes/        the app layer — thin files that compose features (TanStack Start file routing)
  features/
    auth/        components (login form)
    logger/      components + lib/ (session planner, hotkeys) — the live rally logger
    manage/      api/ (paginated list reads) + components/ (data table, tabs, edit dialogs)
    dashboard/   api/ (insight RPC hooks) + components/ (stat card, charts) + lib/ + schemas/
  components/    SHARED UI, one folder per kind:
    ui/          shadcn primitives, themed by tokens only — never edited for one screen
    broadcast/   the design-system graphic kit (ticker, callout, score strip, stat row/tile,
                 result chip, form guide, trait chip, ball dots, count-up)
    layouts/     page furniture — site header, theme toggle, the not-found stub
    court/       hand-drawn court SVGs
    rally/       the rally-entry composites (editor, house-rules form)
    typography   the type scale itself (PageTitle/SectionTitle/Overline) — a foundation,
                 not a graphic, so it sits above the folders rather than in one
  lib/           SHARED non-UI:
    schemas/     zod domain schemas — one file per concept (player, match, game, rally, auth)
    api/         entity data-access used across features — CRUD + the FIFO write queue
    rally/       the rally-entry engine — draft state machine + the write-intent contract
    scoring/     pure live logic (running score, server suggestion, game-over)
    auth/        session primitives (fetch user, sign out)
    supabase/    browser + server clients
```

Each feature's `api/` follows one convention: **one request per file** — the fetcher, its
`queryOptions`, and the `useXxx` hook, colocated (mutations the same way). Components consume hooks;
nothing outside an `api/` (or `lib/api`) calls Supabase directly.

**Hooks take a single options object, and the caller configures the query.** A hook's `queryKey` and
`queryFn` are its identity — change either and you're describing a different request — so those stay
the hook's. Everything else about how the query behaves (`enabled`, `staleTime`, `select`,
`placeholderData`) belongs to the caller, which is the only party that knows the surface it's
rendering into:

```ts
type UseServeStatsOptions = {
  playerId: string
  filters?: InsightFilters
  queryConfig?: QueryConfig<typeof serveStatsOptions>
}

export function useServeStats({ playerId, filters = {}, queryConfig }: UseServeStatsOptions) {
  return useQuery({ ...serveStatsOptions(playerId, filters), ...queryConfig })
}
```

`QueryConfig` / `MutationConfig` live in [lib/react-query.ts](../src/lib/react-query.ts); `QueryConfig`
is literally the options minus those two keys. Mutations do the same with `mutationConfig`, with one
extra rule: a mutation hook owns the cache invalidation its write implies, so it destructures the
caller's `onSuccess` out, invalidates first, then calls it — a caller's callback runs *after* the
cache settles, never instead of it. `mutationFn` is applied after the spread so it can't be replaced.

Without this half of the convention, a caller that needs one option has to reach past the hook to its
`queryOptions` and call `useQuery` itself. That's how `usePlayerInsights` came to fire six queries
behind a call site that looked like one.

## The one rule

Dependencies flow **one way**: `shared → features → routes`. Concretely:

- A **feature never imports another feature**. If two features need the same thing, that thing isn't
  feature-specific — it moves to `lib/` or `components/`.
- **Shared code never imports a feature.** `lib/` and `components/` sit below features and can't reach
  up into them.
- **Nothing outside `routes/` imports a route.** Routes are the top; they compose features, and
  cross-feature composition happens _only_ there.

This isn't a convention you have to remember — it's **enforced by ESLint** (`import/no-restricted-paths`
in [eslint.config.js](../eslint.config.js)), so a violating import fails `pnpm lint` and CI. That
last clause was untrue until Aug 2026 — CI ran `check`, `typecheck`, `test` and `build` but never
`lint`, so the rule this whole document rests on was enforceable only by remembering to run it.
`pnpm lint` is now a CI step.

The `.storybook` harness is a zone too: stories may import it, nothing in `src/` may. Its
`#storybook/*` alias lives in the same tsconfig `paths` block the app uses, so without that zone a
route could import the fixture cast and ship it to `dist/client` with every gate green.

## Where does a new file go?

1. **Only one feature uses it?** → that feature
   (`features/<x>/{api,components,hooks,lib,schemas}`). Those five are the whole vocabulary:
   requests, UI, stateful React logic, pure logic, parsed shapes. `hooks/` is the narrow one — it
   is for a `useXxx` that owns component state and nothing else; a hook that fetches is a request
   and belongs in `api/`, and a function with no state at all is pure logic and belongs in `lib/`.
   A feature grows a sixth folder only when it earns a genuinely new kind of thing — a new
   *kind*, not a new word for one of these. The logger carried a `logic/` for a while holding
   exactly what `lib/` holds (its hotkey map and session planner, both pure), which is how you
   can tell: if the test for the new folder is "what would go in it that could not go in `lib/`",
   and there is no answer, it is a second spelling.
2. **Two or more features use it?** → shared. UI to `components/`, everything else to `lib/`. It is
   _not_ owned by whichever feature happened to build it first.
3. **A new page?** → a thin file in `routes/` that pulls the pieces together.

Rule 2 is the one that bites. The **rally-entry engine** (the draft state machine in `lib/rally`, the
`rally-editor` and house-rules form in `components/rally`, and `lib/scoring`) and the **entity
data-access layer** (`lib/api`) are shared for exactly this reason: the logger _and_ manage's edit
dialogs both build on them, so by the one-way rule they can't live inside either feature. The
logger's session planner produces `WriteIntent`s; the contract for those (`lib/rally/write-intent.ts`)
is shared so `lib/api` can execute them without importing the planner.

Entity **reads** split by use: a read only one feature needs lives in that feature's `api/`; a read
several surfaces share (`get-players`, `get-match-detail`) lives in `lib/api`.

## Component API conventions

One spelling per idea. These aren't style preferences — each one was two or three
spellings until the whole kit went into Storybook side by side and the drift became obvious.

**Pairs.** Everything a player owns is `p1X` / `p2X`: `p1Name`, `p1Score`, `p1Attrs`, `p1Data`.
Never `name1`, never `a` / `b`.

Ids are the one place with two spellings, and both are correct in their context:

- `player1Id` / `player2Id` where the id is a **field of a domain object** — the zod schemas, the
  scoring contexts, the RPC hook arguments. It echoes the `player1_id` columns.
- `p1Id` / `p2Id` where the id is a **component prop sitting beside `p1Name`** — `ScoreHeader`
  and `RallyTimeline` both do this, and `p1Name`/`player1Id` on one component would read worse
  than either rule alone.

If you're adding a prop next to `p1Name`, use `p1Id`. If you're adding a field to a schema or a
fetcher signature, use `player1Id`.

**Colour props.** The design system's colour law says every value belonging to a player wears
their side, so the prop that carries it is always called `side`:

| Prop      | Means                                              | Values                                                               |
| --------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `side`    | this value belongs to that player                  | `"p1" \| "p2"` (`"neutral"` where the house can own it)              |
| `tone`    | emphasis that is nobody's colour                   | `"muted" \| "primary"`, `"accent" \| "loss"`                         |
| `outcome` | a **result** — the only one that carries a verdict | `"p1" \| "p2"` plus whatever unresolved states that surface can show |

`outcome`'s exact union is per-component, because the states a surface can show differ:
`MatchRow` lists every match, so it needs `"draw"` and `"pending"`; `ScoreStrip` renders one
finished scoreline and takes `"p1" | "p2" | null`, where `null` means "don't colour a side". Don't
copy one component's union into another — decide which unresolved states _your_ surface can
actually be asked to render.

**Make the wrong call impossible before documenting it.** Where a prop combination would render
something dishonest, close it in the type rather than warning about it in a comment —
`StatCard` is a discriminated union so a rate can't grow a unit, and its test file pins each
rejected combination with `@ts-expect-error` (an unused directive is itself a tsc error, so the
gate can't rot).

**`className` last.** Anything in `components/` that a page _places_ is expected to take one, so it
can be positioned without a wrapper — the whole `broadcast/` kit, `CourtDiagram`, the typography
primitives, `ThemeToggle`.

Three don't, and would need a wrapper: `CourtEmptyMedia` (it's a fixed slot inside `Empty`),
`PageStub` (it renders its own `<main>` — it's a page, not a block), and the `rally/` form
sections. Adding `className` to one of those is fine if a caller needs it; just don't assume it's
already there.

## Enforcement detail

The boundary rule matches on _resolved file paths_, so it needs the `@/` alias to resolve. That's
wired in `eslint.config.js` via eslint-plugin-import-x's `import-x/resolver-next` with the TypeScript
resolver — **not** the classic `import/resolver` key, which import-x@4 silently ignores (the rule then
no-ops without error). After touching resolver config, confirm the rule still _fires_ by planting a
cross-feature import and checking it errors.
