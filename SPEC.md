# SPEC — the retro board

Both pairs build this, independently, from the same starting point. The spec
describes **behaviour only**: which primitive you use to satisfy each line is
the exercise. Two implementations that differ is the desired outcome — that
difference is what you talk about afterwards.

Tiers map to the four 30-minute rotations. Finishing Core + Live + Optimism is
a complete result. Bonus is for whoever is flying.

---

## The data

Agree on this shape early so the two boards are comparable. Everything else is
yours.

```ts
type Column = 'went-well' | 'didnt-go-well' | 'action-items';

interface Card {
  id: string;
  column: Column;
  text: string;
  authorId: string;     // from getMe()
  authorName: string;
  authorHue: number;
  votes: string[];      // authorIds; one vote per person, toggleable
  createdAt: number;
  updatedAt: number;
}
```

`getMe()` in `src/lib/jam.ts` already mints a nickname, hue and stable id per
browser. Do not build a login.

---

## Tier 1 — Core (rotation 1)

- [ ] The board renders three columns: **Went well**, **Didn't go well**, **Action items**.
- [ ] Cards come from the server. The server module holding them must be
      impossible to import from the client.
- [ ] Each card shows its text and who wrote it, coloured by their hue.
- [ ] An empty column says so rather than rendering nothing.
- [ ] While the first load is in flight, the page shows a deliberate loading
      state — not a blank screen, and not a layout jump.

## Tier 2 — Writes (rotation 2)

- [ ] Each column has a form that adds a card to *that* column.
- [ ] Adding a card persists it and it appears on the board.
- [ ] The form clears after a successful add and keeps focus for the next one.
- [ ] Empty or whitespace-only text is rejected **on the server**, not just
      hidden in the UI.
- [ ] With failure rate above zero, a rejected add surfaces a visible error and
      the board is not left in a lying state.
- [ ] Raise latency to 1500ms: adding a card must not feel broken. Decide what
      the user sees while it is in flight and make that deliberate.

## Tier 3 — Live (rotation 3)

- [ ] Open the app in **two windows**. A card added in one appears in the other
      within about a second, with no refresh and no polling.
- [ ] The same is true for votes, edits and deletes once those exist.
- [ ] Somewhere on screen, the connection state is visible
      (connected / reconnecting / closed).
- [ ] Killing the dev server shows the connection dropping; restarting it shows
      recovery without a manual reload.
- [ ] Closing one window releases its stream on the server — no leaked
      subscribers.

> `src/server/bus.ts` already does the fan-out. Solid's live sources are
> per-client and do **not** share data between users on their own.

## Tier 4 — Optimism (rotation 4)

- [ ] Every card has a vote control showing the count and whether *you* voted.
- [ ] Voting is **one per person per card**, and toggles.
- [ ] A vote registers **instantly** — before the server has confirmed it.
- [ ] With failure rate at ~30%, a rejected vote **visibly reverts**. You should
      not be writing rollback code by hand.
- [ ] A slow write shows a "saving…" affordance that is distinguishable from
      the optimistic value itself.
- [ ] Two windows, both voting on the same card, do not corrupt the count.

## Bonus

- [ ] Inline edit of a card's text, with the edit reading as pending until the
      server catches up.
- [ ] Delete, with the card leaving both windows.
- [ ] A filter/search box that narrows the board as you type without refetching.
- [ ] A `/card/:id` detail route where changing the id re-shows a loading state.
- [ ] Columns that reveal in a coordinated order on first paint rather than
      popping in independently.
- [ ] A presence indicator: how many people are connected right now.

---

## Rules of engagement

1. **Do not copy `/playground` into the board.** It runs on a deliberately
   different domain. Copy the *shape*, not the code.
2. **Turn the Chaos Panel up before you trust anything.** At 0ms latency every
   async state in this app is invisible, including the ones you got wrong.
3. **Test in two windows from Tier 3 onward**, not one.
4. When something does not update, read the diagnostic code in the console and
   look it up — `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md`
   maps every code to its fix.

## Definition of done

Two windows side by side. Latency 1500ms, failure 30%. Add a card, vote on it,
watch the other window follow along, and watch a rejected vote take itself
back. If that demo works, you are done.
