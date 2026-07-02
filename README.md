# Sam vs the World

A personal squash analytics app. Matches are recorded on video, reviewed afterwards, and logged
**rally-by-rally** — one row per point, capturing how every rally ended (winner, tin, stroke, ace,
serve fault…), serve side and number, and rally length. The footage itself is never stored; the
ordered rally sequence is the single source of truth, and everything else — running scores, game and
match winners, head-to-head records, serve stats, comebacks, streaks — is derived from it.

## Stack

- [TanStack Start](https://tanstack.com/start) (React 19 + TypeScript) — SSR'd public dashboard,
  client-heavy private logger
- [Supabase](https://supabase.com) (Postgres) — schema-enforced rally data, derived views,
  RPC-per-insight, RLS (public read / owner-only write)
- [shadcn/ui](https://ui.shadcn.com) + Tailwind 4 — themed from a single preset
- Recharts, TanStack Query, Vitest + Playwright, Cloudflare Workers

## Project brief

The full specification — data model, insight definitions, page specs, architecture, test strategy,
and roadmap — lives in [PROJECT_PLAN.md](PROJECT_PLAN.md). Work is organised as
[issues](../../issues) grouped by phase milestones; one issue = one PR.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm test
npm run build
```
