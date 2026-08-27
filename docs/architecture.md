# Architecture

How the frontend is organised, and the one rule that keeps it that way. For the *why*, see
[decisions.md #14](decisions.md). The plan of record is [PROJECT_PLAN.md](../PROJECT_PLAN.md) §8.2.

## The shape

Feature-based, following [bulletproof-react](https://github.com/alan2207/bulletproof-react/tree/master/apps/react-vite).
Code is grouped by *what it's for*, not by *what kind of thing it is*.

```
src/
  routes/        the app layer — thin files that compose features (TanStack Start file routing)
  features/
    auth/        components (login form)
    logger/      components + logic/ (session planner, hotkeys) — the live rally logger
    manage/      api/ (paginated list reads) + components/ (data table, tabs, edit dialogs)
    dashboard/   api/ (insight RPC hooks) + components/ (stat card, charts) + lib/ + schemas/
  components/    SHARED UI: ui/ (shadcn) · layouts/ · court/ · rally/ (editor, house-rules) · ball-dots
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

## The one rule

Dependencies flow **one way**: `shared → features → routes`. Concretely:

- A **feature never imports another feature**. If two features need the same thing, that thing isn't
  feature-specific — it moves to `lib/` or `components/`.
- **Shared code never imports a feature.** `lib/` and `components/` sit below features and can't reach
  up into them.
- **Nothing outside `routes/` imports a route.** Routes are the top; they compose features, and
  cross-feature composition happens *only* there.

This isn't a convention you have to remember — it's **enforced by ESLint** (`import/no-restricted-paths`
in [eslint.config.js](../eslint.config.js)), so a violating import fails `pnpm lint` and CI.

## Where does a new file go?

1. **Only one feature uses it?** → that feature (`features/<x>/{api,components,lib,schemas}`). Those
   four are the whole vocabulary: requests, UI, pure logic, parsed shapes. A feature grows a fifth
   folder only when it earns a genuinely new kind of thing (the logger's `logic/`, not a second
   spelling of `lib/`).
2. **Two or more features use it?** → shared. UI to `components/`, everything else to `lib/`. It is
   *not* owned by whichever feature happened to build it first.
3. **A new page?** → a thin file in `routes/` that pulls the pieces together.

Rule 2 is the one that bites. The **rally-entry engine** (the draft state machine in `lib/rally`, the
`rally-editor` and house-rules form in `components/rally`, and `lib/scoring`) and the **entity
data-access layer** (`lib/api`) are shared for exactly this reason: the logger *and* manage's edit
dialogs both build on them, so by the one-way rule they can't live inside either feature. The
logger's session planner produces `WriteIntent`s; the contract for those (`lib/rally/write-intent.ts`)
is shared so `lib/api` can execute them without importing the planner.

Entity **reads** split by use: a read only one feature needs lives in that feature's `api/`; a read
several surfaces share (`get-players`, `get-match-detail`) lives in `lib/api`.

## Enforcement detail

The boundary rule matches on *resolved file paths*, so it needs the `@/` alias to resolve. That's
wired in `eslint.config.js` via eslint-plugin-import-x's `import-x/resolver-next` with the TypeScript
resolver — **not** the classic `import/resolver` key, which import-x@4 silently ignores (the rule then
no-ops without error). After touching resolver config, confirm the rule still *fires* by planting a
cross-feature import and checking it errors.
