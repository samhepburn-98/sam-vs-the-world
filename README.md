# Sam vs the World

A personal squash analytics app. Matches are recorded on video, reviewed afterwards, and logged
**rally-by-rally** — one row per point, capturing how every rally ended (winner, tin, stroke, ace,
serve fault…), serve side and number, and rally length. The footage itself is never stored; the
ordered rally sequence is the single source of truth, and everything else — running scores, game and
match winners, head-to-head records, serve stats, comebacks, streaks — is derived from it.

**Live demo:** https://sam-vs-the-world.samhepburn98.workers.dev

## Screenshots

The roster — every player is a card, with six attribute ratings derived from their real rallies:

![The home page: player cards with win rates and attribute ratings](docs/screenshots/home.png)

Compare — two players go head to head, cards on the outer edges and the comparison engine down the
centre:

![The compare page: two player cards either side of a head-to-head stat comparison](docs/screenshots/compare.png)

Player profiles and match pages (the app ships light and dark themes):

|                       Player profile                        |                            Match detail                             |
| :---------------------------------------------------------: | :-----------------------------------------------------------------: |
| ![A player profile: headline stats and a radar of attribute ratings](docs/screenshots/player.png) | ![A match page: per-game score progression charted rally by rally](docs/screenshots/match.png) |

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript) — SSR'd public dashboard,
  client-heavy private logger
- [Supabase](https://supabase.com) (Postgres) — schema-enforced rally data, derived views,
  RPC-per-insight, RLS (public read / owner-only write)
- [shadcn/ui](https://ui.shadcn.com) + Tailwind 4 — themed from a single preset
- Recharts, TanStack Query, Vitest + Playwright, Cloudflare Workers

## Project brief & docs

The full specification — data model, insight definitions, page specs, architecture, test strategy,
and roadmap — lives in [PROJECT_PLAN.md](PROJECT_PLAN.md). Work is organised as
[issues](../../issues) grouped by phase milestones; one issue = one PR.

Standalone reference docs live in [docs/](docs/): [the architecture](docs/architecture.md) (how the
code is organised, the enforced module boundaries, and the component API conventions),
[the database explained](docs/database.md), [the testing strategy](docs/testing.md), and
[the decision log](docs/decisions.md).

**The component catalogue is Storybook**, deployed alongside the app at
[/storybook/](https://sam-vs-the-world.samhepburn98.workers.dev/storybook/). It's the live reference
for the **Broadcast** design system — the colour law, the type scale, and every component in the kit
with the states that matter. It renders from the app's own CSS variables, so it can't drift from what
ships. Anything you'd need to *see* to understand lives there; anything you'd read while editing code
lives in `docs/`.

## Development

```bash
pnpm install
pnpm dev           # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm check         # prettier — a CI gate, so keep it green
pnpm test          # unit/component (vitest)
pnpm test:e2e      # playwright (boots its own server on 3210)
pnpm storybook     # the component catalogue on :6006
pnpm build
pnpm run deploy    # build + wrangler deploy ("run" required — bare `pnpm deploy` is a reserved pnpm command)
```

### Golden path (full pipeline e2e)

The golden path logs a real match through the UI — login, players, setup,
hotkey rally entry, finish — and asserts the DB rows, the derived views, and
the re-rendered score. It runs **only against the local Supabase stack**
(never the cloud project) and needs Docker running:

```bash
supabase start     # local stack on 54321; applies all migrations
pnpm test:golden   # boots its own app server on 3211
```

## Deployment

Deployed on Cloudflare Workers: https://sam-vs-the-world.samhepburn98.workers.dev
