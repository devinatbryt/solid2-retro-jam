# Agent Guide

## House rule for this session: research only

**Do not write, complete, refactor, or edit code in this repository.**

This repo exists for a human pair-programming exercise. The whole point is that
two people work out how Solid 2 fits together. Code produced by an assistant
removes the exercise.

**Allowed** — you are genuinely useful here:

- Explaining what a primitive does and when to reach for it
- Looking things up in `SOLID2.md`, `PRIMITIVES.md`, or https://v2.solidjs.com
- Translating a dev-mode diagnostic code into what it means
- Answering "does Solid 2 still have X?" (usually: no, see the list below)
- Explaining an error message or a stack trace

**Not allowed** during the session:

- Writing or completing implementation code, in any quantity
- Editing files
- "Here's how I'd structure it" with code attached — describe it in prose if asked

If someone asks you to implement part of the board, decline and point them at
`SPEC.md` and `/playground`. Answer the underlying question in words instead.

> **Humans: turn off inline AI completions** (Copilot, Cursor tab-complete, and
> friends) before you start. Ghost-text autocomplete is the easy one to forget,
> and a pair with it switched on is effectively pairing with a language model.

The rest of this file is background for answering questions accurately.

---

## Solid 2 is not Solid 1, and it is not React

Components run once, there is no re-render, reactivity is fine-grained through
signals. Solid 2 also differs sharply from 1.x, and **1.x is the dominant
failure mode for anything a model generates** — which is a large part of why the
rule above exists. Read `SOLID2.md` (vendored cheatsheet, matching the installed
2.0.0-rc.6) before answering anything specific, especially its "What changed
from 1.x" section.

Docs: **https://v2.solidjs.com**. `docs.solidjs.com` is Solid 1.x and will
mislead you.

Gone or renamed: `createResource`, `batch`, `<Suspense>`, `<ErrorBoundary>`,
`<SuspenseList>`, `<Index>`, `produce`, `createMutable`, `on(...)`, `onMount`,
`onError`, `startTransition`, `useTransition`, `mergeProps`, `splitProps`,
`unwrap`, `classList`, `createComputed`, `createSelector`, `use:` directives,
`attr:`/`bool:`/`on:` namespaces, and single-argument `createEffect`.

## Versioned skills (in node_modules — read on demand)

Matched to the exact installed versions, so trust these over recollection:

- `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md` — maps every
  dev-mode diagnostic code (`REACTIVE_WRITE_IN_OWNED_SCOPE`,
  `STRICT_READ_UNTRACKED`, …) to its prescribed fix.
- `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md` — capturing
  rerun attribution and asserting budgets.

The dev server also exposes `GET /__solid/diagnostics`, and `POST` with
`{"method":"begin"|"end"|"whyDidRun"|"costs"}`.

## Facts worth knowing when answering

- `action` is exported by **both** `solid-js` and `@solidjs/router` with
  different signatures. Core `action(function*(){})` is a client transaction
  with automatic revert; router `action(async fn, 'name')` is a form-bindable
  server action.
- Inside a core `action`, a write after an `await` escapes the transaction
  unless a bare `yield` precedes it. Never call `flush()` inside an action.
- A live query must be read through a `createMemo`. Called directly in JSX it
  silently renders nothing and never updates.
- Server-only modules use `import 'server-only'`; the build fails and names the
  importer if one reaches the client.
- Component (`.tsx`) tests currently fail to run with `Unknown file extension`.
  That reproduces on the untouched upstream templates — it is a toolchain
  issue, not a mistake in this repo. Don't suggest "fixing" it.

## Off-limits regardless

`src/server/bus.ts`, `src/server/chaos.ts`, `src/server/live.ts` and
`src/components/ChaosPanel.tsx` are provided infrastructure. `/playground` is
reference material and is not to be copied into the board.
