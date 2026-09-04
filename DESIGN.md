# DESIGN

Tailwind v4 via `@tailwindcss/vite`. No config file, no content globs — utilities
are generated from what it finds in your source.

The point of this page is that **nobody should spend jam time on spacing**.
Paste from here and move on.

## Tokens

Defined in `src/App.css` under `@theme`, so they work as normal Tailwind colours
(`bg-surface`, `text-muted`, `border-line`, …).

| Token | Use |
|---|---|
| `surface` | Page background |
| `surface-2` | Cards, panels, anything raised |
| `line` | Borders and dividers |
| `muted` | Secondary text |
| `accent` | Primary action, focus, links |
| `went-well` | Column 1 accent (green) |
| `didnt-go-well` | Column 2 accent (red) — also the error colour |
| `action-items` | Column 3 accent (amber) |

## State classes

Pre-defined in `@layer components` so they always exist. These are the reason
the `class` array/object form is worth learning:

```jsx
<li class={['rounded-lg border border-line p-3', {
  'is-optimistic': !confirmed(),        // dashed outline — not settled yet
  'is-pending':    isPending(thing),    // pulsing — a change is in flight
  'is-reverted':   rejected(),          // shake + red — the server said no
  'is-stale':      revalidating(),      // faded — readable but not fresh
}]} />
```

Array entries are always on; object entries toggle by truthiness. **Do not build
class strings** with template literals or `.filter(Boolean).join(' ')` — that is
the `classnames` reflex and it composes badly here. There is no `classList` prop
any more; this replaced it.

## Paste-ready

```jsx
// page shell
<main class="mx-auto max-w-5xl p-6 pb-32">

// board: three columns, stacks on narrow screens
<div class="grid gap-4 md:grid-cols-3">

// column
<section class="flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4">
  <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">Went well</h2>

// card
<article class="rounded-lg border border-line bg-surface p-3 text-sm">

// author chip (hue comes from getMe())
<span class="inline-block size-2.5 rounded-full"
      style={{ background: `hsl(${card.authorHue} 70% 60%)` }} />

// primary button
<button class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface disabled:opacity-50">

// quiet button
<button class="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-white">

// text input
<input class="w-full rounded-lg border border-line bg-surface px-3 py-2" />

// empty state
<p class="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">

// error
<p class="is-reverted rounded-lg p-2 text-sm text-didnt-go-well">
```

Column accents: `border-t-2 border-t-went-well` / `border-t-didnt-go-well` /
`border-t-action-items`.

## Accessibility, cheaply

- Give the vote button an `aria-pressed` reflecting whether *you* voted.
- Announce the connection state with `aria-live="polite"`.
- Column headings should be real headings so the board is navigable.
- Reduced-motion is already handled — `is-pending` and `is-reverted` drop their
  animations under `prefers-reduced-motion`.
