# Agent Guide

This is a **SolidJS 2.0 RC** project. Solid is not React — components run once,
there is no re-render, reactivity is fine-grained through signals. Solid 2 is
also not Solid 1.x, and **1.x is the dominant failure mode for generated code
here**. Do not port patterns from either.

Before writing Solid code in this repo, read **`SOLID2.md`** (vendored
cheatsheet, matches the installed 2.0.0-rc.6) — especially its
"What changed from 1.x" section. `PRIMITIVES.md` lists what exists and when to
use it.

Docs are at **https://v2.solidjs.com**. `docs.solidjs.com` is Solid 1.x and will
mislead you.

## Versioned skills (in node_modules — read on demand)

The installed packages ship agent skills matched to their exact versions:

- `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md` — maps every
  dev-mode diagnostic code (`REACTIVE_WRITE_IN_OWNED_SCOPE`,
  `STRICT_READ_UNTRACKED`, …) to its prescribed fix. Read it whenever a Solid
  diagnostic code appears in test output or the browser console.
- `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md` — how to
  capture reactive evidence (which scopes re-ran and why, wasted recomputes,
  cost tables) and assert budgets.

## Reactive diagnostics — capture evidence instead of guessing

Use these when debugging reactivity (something doesn't update, updates too
often, or is slow):

- **In tests:** `captureArtifact()` from `@solidjs/diagnostics` wraps a scenario
  and returns a serialisable artifact; matchers from
  `@solidjs/diagnostics/vitest` (`toHaveNoDiagnostics`, `toStayWithinRerunBudget`,
  `toHaveNoWaste`) assert on it.
- **Against the dev server** (`diagnostics: true` is already set; dev-only):
  - `GET /__solid/diagnostics` — status and connected client count
  - `POST /__solid/diagnostics` with `{"method":"begin"}` / `{"method":"end"}`
  - `{"method":"whyDidRun","params":{"name":"<scope name>"}}`
  - `{"method":"costs"}`

Name your signals/memos/effects (`{ name: "..." }`) — attribution reports scopes
by name.

## Project-specific rules

- **Do not touch `src/server/bus.ts`, `src/server/chaos.ts`, or
  `src/components/ChaosPanel.tsx`.** They are provided infrastructure.
- **Do not copy `src/routes/playground/**` into the board.** The playground runs
  on a deliberately different toy domain; it is reference, not a template.
- Server-only modules must `import 'server-only'`. If a client module imports
  one, the build fails and names the importer — that is working as intended.
- Anything the client must not see belongs behind a `'use server'` function.
- `action` is exported by **both** `solid-js` and `@solidjs/router` with
  different signatures. Core `action(function*(){})` is a client transaction
  with automatic revert; router `action(async fn, 'name')` is a form-bindable
  server action. Check which one is imported before editing.
- Inside a core `action`, a write after an `await` escapes the transaction
  unless a bare `yield` precedes it. Never call `flush()` inside an action.

## Verification

```bash
pnpm typecheck    # must pass
pnpm test         # server-side suites; must pass
pnpm lint
```

Component (`.tsx`) tests currently fail to run with `Unknown file extension`.
That reproduces on the untouched upstream templates and is a toolchain issue —
do not try to "fix" it, and do not add `.tsx` test files. See README.

Behaviour that matters here (live sync, optimistic revert) is only observable
in a real browser with the Chaos Panel turned up. A passing typecheck proves
very little in this repo.
