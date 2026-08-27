# Testing

What each layer of tests is *for*, and the habits that keep them honest. The plan of record is
[PROJECT_PLAN.md](../PROJECT_PLAN.md) §10.

## Four layers, four different questions

| Layer | Where | Answers | Run with |
|---|---|---|---|
| **Unit / component** | `src/**/*.test.ts(x)` | does this function or component behave? | `pnpm test` |
| **Database** | `supabase/tests/*.test.ts` | does this SQL derive the right numbers? | `pnpm test` (same runner) |
| **End-to-end** | `e2e/*.spec.ts` | do the pages load and the flows work? | `pnpm test:e2e` |
| **Golden path** | `e2e/golden/` | does a whole real match survive the full pipeline? | `pnpm test:golden` |

Vitest owns everything except `e2e/`, which is excluded from its glob so Playwright can own it.

## The database layer is the unusual one

Every insight in this app is SQL over the rally sequence, so the interesting bugs live in SQL, not in
TypeScript. Those tests run the **real migrations** against [PGlite](https://pglite.dev) — Postgres
compiled to WASM, in-process, no Docker — seed a small timeline, and assert the numbers the RPC
returns.

The discipline that makes them worth having:

- **Load only the migrations under test.** Loading the whole chain drags in dependencies you didn't
  mean to test, and the failure mode is a confusing `function ... does not exist` rather than a
  useful assertion. Seed the post-derivation shape directly instead.
- **Seed a timeline, not a row.** Records, streaks and momentum are order-dependent; a fixture with
  one match can't catch an ordering bug.
- **Write the fixture comment as a timeline.** `records-rpc.test.ts` spells out what each date
  contributes and *what a wrong number would mean* ("8 would mean the draw failed to sever the run,
  4 would mean the pending match broke it"). That comment is the test's real assertion — it's what
  tells the next reader whether a changed expectation is a fix or a regression.

## Mutation-test anything order-dependent

A tie-breaking `order by` tail, a sort comparator, a threshold — these are exactly the code that
passes its tests whether or not it's correct, because the fixture happens not to exercise the tie.

So: **break it on purpose and watch a test go red.** Flip the ordering tail, run the suite, confirm
exactly the test you expected fails, then put it back. If nothing goes red, the fixture isn't
load-bearing and the test is decoration. This is how the six ordering tails in `records()` were
proven, and how the four `@ts-expect-error` assertions on `StatCard` were checked.

## Types are tests too

`pnpm typecheck` is part of the suite, not a separate concern — an unused `@ts-expect-error` is
itself a compile error, which makes it a genuine assertion that some code *doesn't* compile. Use it
where a prop combination would render something dishonest; see the union in
[stat-card.tsx](../src/features/dashboard/components/stat-card.tsx) and its test.

## Component tests vs stories

They overlap, and the split is deliberate:

- A **story** is the catalogue entry — it shows a state to a human, and it's how the component gets
  found when someone's planning a page. Stories cover *breadth*: every component, its meaningful states.
- A **test** pins behaviour a human wouldn't reliably notice — an honesty gate that must not render a
  number, a keyboard path, a computed series. Tests cover *depth*, and only where there's something
  to get wrong.

Don't write a test that only asserts a component rendered; that's what the story is for. Don't write
a story per prop permutation; that's what the test is for.

## Running them

```bash
pnpm test                 # vitest: unit, component, and the PGlite database tests
pnpm test -- records      # one file
pnpm typecheck            # part of the suite, not an afterthought
pnpm test:e2e             # playwright, boots its own app server on 3210

supabase start            # needs Docker; applies all migrations locally
pnpm test:golden          # the full pipeline against the LOCAL stack only, on 3211
```

The golden path never runs against the cloud project — it writes real rows.

## CI

`.github/workflows/ci.yml` runs `pnpm check` (prettier), `pnpm typecheck`, `pnpm test`, `pnpm build`
on every PR. `pnpm check` is a gate, so a formatting drift fails the build — run `pnpm format`
before pushing rather than discovering it in CI.
