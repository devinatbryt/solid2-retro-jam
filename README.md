# Solid 2.0 Retro Jam

A two-hour pair-programming exercise on **Solid 2.0 RC**. Two pairs, one spec,
two independent builds, then compare.

You are building a live retro board. What is already here is the boring part —
a fan-out bus, chaos knobs, identity, and a playground showing each new
primitive once. The board itself is yours.

| File | What it is |
|---|---|
| **`SPEC.md`** | What to build. Behaviour only — the primitives are your call. |
| **`PRIMITIVES.md`** | The menu: every primitive and when to reach for it. No code. |
| **`SOLID2.md`** | The full Solid 2.0 cheatsheet, vendored from the package. |
| **`DESIGN.md`** | Tailwind utility strings so nobody bikesheds spacing. |
| **`/playground`** | Each primitive demonstrated once, on a toy domain. |

---

## Setup

Requires **Node 20.19+ or 22.12+** (`.nvmrc` pins 22.20.0) and **pnpm**.

```bash
pnpm install
pnpm dev          # http://localhost:3000  — generates .env on first run
```

Then **open it in two windows**. Not two tabs you switch between — two windows
side by side, where you can see both at once. Most of this exercise is
invisible otherwise.

```bash
pnpm typecheck    # tsc --noEmit
pnpm test         # vitest (server-side suites)
pnpm lint         # oxlint
pnpm build        # streaming SSR build to dist/
```

---

## The Chaos Panel

Bottom-right of every page. Two sliders:

- **Latency** — delay on every server call, read and write.
- **Write failure** — probability that a write is rejected.

**Use it.** On localhost every server function resolves in about a millisecond,
which means `<Loading>` fallbacks never paint, `isPending` is never true long
enough to see, an optimistic write is indistinguishable from a real one, and
`<Errored>` never fires. At 0ms you cannot tell working code from broken code.

Settings are process-wide and shared live across every open window — which is
also a working demonstration of `liveQuery`.

---

## How the pairing works

Four people, two pairs. Driver and navigator swap **every 30 minutes** — the
driver types, the navigator reads the spec and the docs and does not touch the
keyboard.

| Rotation | Tier | Roughly |
|---|---|---|
| 1 (0–30) | Core | Data shape, server module, render three columns |
| 2 (30–60) | Writes | Add a card, error + loading states |
| 3 (60–90) | Live | Two windows stay in sync |
| 4 (90–120) | Optimism | Voting that reverts when the server says no |

Branch off `main` at the start:

```bash
git switch -c pair-a   # or pair-b
```

`main` stays pristine so both branches diff against the same base.

---

## Solid 2 is not Solid 1, and it is very much not React

The single biggest risk to this session is that your editor's AI assistant
confidently writes Solid 1.x. It will. `createResource`, `batch`, `<Suspense>`,
`<ErrorBoundary>`, `<Index>`, `produce`, `onMount`, `mergeProps`, `splitProps`,
`classList`, `use:` directives and single-argument `createEffect` are all gone
or renamed.

The five that will actually bite you:

1. **`createEffect` takes two arguments** — `(compute, apply)`. Whatever `apply`
   *returns* is treated as a cleanup function.
2. **Setters do not update reads immediately.** `setX(1); x()` returns the old
   value until the microtask flushes. In tests, `flush()` first.
3. **No writes inside an owned scope.** Writing a signal from a component body
   or a memo throws in dev. Move it to an event handler or `onSettled`.
   `untrack` does not help.
4. **Props are values, not accessors.** `<X v={count()} />`, never
   `<X v={count} />`. And never destructure props.
5. **`<For>`'s callback shape changes with the keying.** Keyed gives you a raw
   item and an index accessor; `keyed={false}` gives you an item accessor and a
   plain index.

`AGENTS.md` points your assistant at the versioned skills shipped inside
`node_modules`. Those are matched to the exact installed version — trust them
over anything the model remembers.

---

## Known rough edges (Solid 2 is an RC)

These are real, we hit them, and none of them are your bug:

- **A `liveQuery` channel does not connect on a hard SSR page load.** Hydration
  adopts the server-serialised first value and nothing in the browser ever
  pulls, so `status()` sits at `"connecting"` forever. Client-side navigation
  into a route is fine because `route.preload` warms the channel. The
  workaround, used in `ChaosPanel.tsx` and `routes/playground/live.tsx`, is one
  `revalidate(theQuery.key)` inside `onSettled`.
- **A live server function is called during SSR too, and must not subscribe
  there.** The page render pulls one value and abandons the generator, which
  leaves it suspended on its `yield` forever — its `finally` never runs, so any
  subscription it registered leaks, once per page render. `src/server/live.ts`
  detects this (`isLiveConnection()`) and the live functions yield current
  state and return instead. Worth reading before you write your own live query.
- **Component (`.tsx`) tests do not run.** Vitest fails with
  `Unknown file extension ".tsx"`. This reproduces on the untouched upstream
  templates across every combination of vite 8.1/8.2, vitest 4.0/4.1 and
  jsdom 25/30, so it is a toolchain issue, not a config mistake here. Server-side
  (`.ts`) tests work fine — see `src/server/bus.test.ts`. Don't spend session
  time on it.
- **`curl` gets a 404 from the dev server** unless you send
  `Accept: text/html`. Page renders are content-negotiated. Browsers are fine.
- **`latest` npm tags are misleading.** `solid-js@latest` is 1.9.x and
  `@solidjs/router@latest` is 1.0.0. Every version here is pinned exactly, and
  the lockfile is committed. Please don't run `pnpm update`.

## Stack

`@solidjs/vite-plugin` 3 in **start mode** — streaming SSR, `'use server'`
functions, cookie sessions, API routes. Note this is *not* SolidStart:
SolidStart is pinned to Solid 1 and does not support Solid 2. Docs live at
**[v2.solidjs.com](https://v2.solidjs.com)** — `docs.solidjs.com` is 1.x and
will actively mislead you.
