import type { DefaultError, UseMutationOptions } from "@tanstack/react-query"

// The caller's half of the api/ convention (§8.4, architecture.md), modelled
// on bulletproof-react's src/lib/react-query.ts.
//
// Every `useXxx` hook owns its queryKey and its fetcher — those two ARE the
// hook, and a caller that changes either is describing a different request.
// Everything else about how the query behaves — `enabled`, `staleTime`,
// `select`, `placeholderData`, `refetchInterval` — is the caller's business,
// because only the caller knows the surface it's rendering into.
//
// `QueryConfig` is that contract as a type: the hook's own options minus the
// two it won't surrender. Without it, a caller needing `enabled` has to reach
// past the hook to its `queryOptions` and call `useQuery` itself — which is
// what usePlayerInsights ended up doing, and why six queries went unnoticed
// behind one call site.

/** An async fetcher's resolved value, unwrapped from its Promise. */
export type ApiFnReturnType<
  FnType extends (...args: Array<never>) => Promise<unknown>,
> = Awaited<ReturnType<FnType>>

/** Everything a caller may override on a query: the hook's options minus the
 *  queryKey and queryFn that define which request it is. */
export type QueryConfig<T extends (...args: Array<never>) => unknown> = Omit<
  ReturnType<T>,
  "queryKey" | "queryFn"
>

/** The mutation equivalent. `mutationFn` is likewise not the caller's to
 *  replace, and is applied after the spread in each hook so it can't be. */
export type MutationConfig<
  MutationFnType extends (...args: Array<never>) => Promise<unknown>,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  DefaultError,
  Parameters<MutationFnType>[0]
>
