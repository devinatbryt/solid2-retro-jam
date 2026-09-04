# The primitive menu

Names and *when to reach for them* — no code. This page exists so nobody loses
the session to an unknown-unknown ("I didn't know `latest()` existed"), while
leaving the actual design decisions to you.

For the spelling of any of these, see `/playground` or `SOLID2.md`.
For what to build, see `SPEC.md`.

> Everything below is imported from `solid-js` unless noted. DOM-side things
> come from `@solidjs/web`; routing and data-fetching things from
> `@solidjs/router`. `solid-js/web` and `solid-js/store` do **not** exist any more.

---

## State

| Primitive | Reach for it when |
|---|---|
| `createSignal` | A value changes and things should react. Also has a *function* form, which is a writable derived value. |
| `createMemo` | A value is derived from other values. Also the async primitive — return a Promise and it becomes an async read. |
| `createStore` | State is an object or array and you want property-level tracking. Setters take a **draft** you mutate in place. |
| `createProjection` | A read-only collection derived from something else, optionally keyed. Replaces 1.x `createSelector`. |
| `createOptimistic` | A single value should show its expected result before the server confirms it. |
| `createOptimisticStore` | Same, but for a collection — the usual choice for a list you add to or edit. |

## Effects and lifecycle

| Primitive | Reach for it when |
|---|---|
| `createEffect(compute, apply)` | You need a side effect on change. **Two arguments.** The compute phase tracks; the apply phase runs untracked and whatever it *returns* is treated as a cleanup. |
| `onSettled` | Component-level setup/teardown — intervals, listeners, imperative init. Return a cleanup. This is what 1.x `onMount` became. |
| `untrack` | You need to read without subscribing. Note it does **not** let you write inside an owned scope. |
| `flush` | You need queued updates applied *right now* — mostly tests. Never inside an `action`. |

## Async and transitions

| Primitive | Reach for it when |
|---|---|
| `<Loading>` | Something below might not be ready yet. Replaces `<Suspense>`. `on={key}` re-shows the fallback when the key changes. |
| `<Errored>` | Something below might throw. Replaces `<ErrorBoundary>`. The fallback gets `(error, reset)` and boundaries heal on their own. |
| `<Reveal>` | Several sibling `<Loading>`s should reveal in a coordinated order rather than whenever each happens to land. |
| `isPending` | You want to mark data as "a change to this is in flight". Not the same as 1.x `.loading`. |
| `latest` | You want the in-flight value during a transition rather than the settled one. |
| `action` (from `solid-js`) | A mutation whose writes **span an async gap** and must revert cleanly on failure. Generator function. |
| `affects` | You know an in-flight write will change some data you cannot show yet, and want it to read as pending. |
| `refresh` | You need a derived read to re-ask its question after a write. Silent by default — pair with `affects` if it should read as pending. |

## Control flow

| Component | Reach for it when |
|---|---|
| `<For>` | Rendering a list. Default is keyed by identity; `keyed={false}` replaces 1.x `<Index>`; `keyed={fn}` for a custom key. **The callback shape changes with the keying** — check which argument is the accessor. |
| `<Repeat>` | You need N of something and there is nothing to diff. |
| `<Show>` | One condition. The function-child form narrows the value. |
| `<Switch>` / `<Match>` | Several mutually exclusive branches. |
| `dynamic` / `<Dynamic>` | The component itself is chosen at runtime. |
| `<Portal>` (`@solidjs/web`) | It must render outside the current DOM subtree. Throws on the server. |

## Data and routing (`@solidjs/router`)

| Primitive | Reach for it when |
|---|---|
| `query(fn, name)` | A cached, keyed read. Revalidated automatically after actions settle. |
| `liveQuery(fn, name)` | A read that keeps yielding. One shared connection per `name + args`; `.status()` is a reactive read of the connection. The function must be an **async generator** that re-yields current state on every invocation. |
| `action(fn, name)` | A write. Bindable straight to `<form action={...}>`, so it works before hydration. `.with(...)`, `.onSubmit`, `.onSettled`. |
| `useAction` | You want to call an action from an event handler instead of a form. |
| `useSubmissions` | You want to render in-flight submissions — a natural "saving…" affordance. |
| `revalidate(key)` | You need to force a query or live channel to re-ask. |
| `route.preload` | Data should start loading as navigation begins. Also the page's single-flight manifest, and what warms a `liveQuery` channel. |

## Server side

| Thing | Reach for it when |
|---|---|
| `'use server'` | The function body must run on the server. The compiler turns it into a typed fetch for the client. |
| `import 'server-only'` | A module must **never** reach the client bundle. The build fails and names the importer if it would. |
| `getRequestEvent()` (`@solidjs/web`) | You need the request — headers, cookies, and `request.signal` for stream cleanup. |
| API routes (`GET`/`POST` exports) | You need a plain HTTP endpoint rather than a server function. |

---

## Things that no longer exist

If you reach for one of these, you have a 1.x reflex. The replacement is in
`SOLID2.md`.

`createResource` · `batch` · `<Suspense>` · `<ErrorBoundary>` · `<SuspenseList>` ·
`<Index>` · `produce` · `createMutable` · `on(...)` · `onMount` · `onError` ·
`startTransition` · `useTransition` · `mergeProps` · `splitProps` · `unwrap` ·
`classList` · `createComputed` · `createSelector` · `use:` directives ·
`attr:` / `bool:` / `on:` namespaces · single-argument `createEffect`
