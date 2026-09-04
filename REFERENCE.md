# Reference solution

**Do not read this during the session.** It exists so the organiser has a
working answer to compare against, and as a rescue if a pair is genuinely stuck
at the 90-minute mark.

It satisfies all of Core, Live and Optimism in `SPEC.md`, plus edit, delete,
filter and presence from Bonus. It is *an* answer, not *the* answer — if your
board differs, that difference is the interesting part of the retro.

## What's here

| File | Role |
|---|---|
| `src/board-model.ts` | Shared vocabulary: `Column`, `Card`, labels. Imports nothing. |
| `src/server/board.ts` | `server-only` store + bus. Validation and authorisation live here. |
| `src/lib/board.ts` | `query` / `liveQuery` / `action` server functions. |
| `src/components/Board.tsx` | The whole UI. |

## Four things that cost real time to discover

**1. A live query must be read through a `createMemo`.**

```tsx
const board = createMemo(() => liveBoard());   // ✅ subscribes, updates
// liveBoard()                                  ❌ in JSX: renders nothing, never updates
```

Calling it directly in JSX — or from an optimistic store's compute — silently
yields nothing. The memo is what subscribes. This cost the most debugging time
of anything here, because it fails quietly rather than throwing.

**2. Clearing a form input in `onSubmit` races the router's `FormData` capture.**

Even via `queueMicrotask`, the field goes empty before the action reads it and
the server receives a blank card. Clear when the *submission is registered*
instead — watch `useSubmissions(...).length` with a deferred effect.

**3. A live server function also runs during SSR, and must not subscribe there.**

The renderer pulls one value and abandons the generator mid-`yield`, so its
`finally` never runs and the subscription leaks — once per page render.
`isLiveConnection()` in `src/server/live.ts` guards it. Measured leaking
4 → 6 → 7 subscribers across three page loads before the fix.

**4. A `liveQuery` channel never connects on a hard SSR page load.**

Hydration adopts the serialised first value and nothing re-pulls. One
`revalidate(theQuery.key)` inside `onSettled` opens it. Client-side navigation
is fine — `route.preload` warms the channel.

## The shape of the optimistic vote

The whole mechanism, with no rollback code anywhere:

```tsx
const vote = action(async function* (cardId: string) {
  const myId = untrack(() => me().id);
  setCards((list) => {           // tentative — visible immediately
    const card = list.find((item) => item.id === cardId);
    if (!card) return;
    const i = card.votes.indexOf(myId);
    if (i >= 0) card.votes.splice(i, 1);
    else card.votes.push(myId);
  });
  yield submitVote(cardId);      // throws → the write above is discarded
});
```

Verified in a browser with failure at 100%: the count changes on click and
changes back when the server refuses.

## Verified

Two windows, live add propagation, vote propagation, optimistic revert under
forced failure, error surfacing, presence count, `server-only` boundary holding
(no server internals in `dist/client`), typecheck, lint, 14 tests, prod build.

## Lint warnings you can ignore

`pnpm lint` emits three `solid(reactivity)` warnings against `Board.tsx`
(exit code is still 0). All three are false positives from a heuristic tuned
for Solid 1.x, and all three were checked against the running app:

- **`'needle' captures the value of ... 'filter' at setup`** — it does not. The
  memo re-runs on every change and `Array.prototype.filter` is eager, not lazy.
  Verified live: 3 cards → 1 → 0 → 3 as the search box changes.
- **two × `This function should be passed to a tracked scope`** — these are
  `.catch()` callbacks inside event handlers calling `props.onError`. Reading a
  prop inside a promise callback is a plain function call, not a tracked read.

They were left in place rather than contorted around, because the idiomatic
code is the point of a reference.
