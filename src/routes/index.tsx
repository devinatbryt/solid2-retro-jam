import { Title } from "@solidjs/meta";
import type { RouteDefinition } from "@solidjs/router";
import { createMemo } from "solid-js";

import { getMe } from "../lib/jam";
import { getCards } from "../lib/cards";
import { Column } from "../components/Column";

// ===========================================================================
//  THIS IS YOUR STARTING POINT.
//
//  Everything below the identity strip is scaffolding you are meant to
//  delete. Read SPEC.md for what to build, PRIMITIVES.md for the menu of
//  things you can reach for, and /playground for each one demonstrated once.
//
//  Do not copy the playground into here. It runs on a toy domain precisely so
//  that mapping it onto cards, columns and votes stays your job.
// ===========================================================================

export const route = {
  preload: () => {
    void getMe();
    void getCards();
  },
} satisfies RouteDefinition;

export default function Board() {
  // A server function read. `getMe` is a query(): cached per key, revalidated
  // by the router after an action settles. It mints a nickname on first visit.
  const me = createMemo(() => getMe());
  const cards = createMemo(() => getCards());
  const actionItems = createMemo(() =>
    cards().filter((card) => card.column === "action-items"),
  );
  const wentWell = createMemo(() =>
    cards().filter((card) => card.column === "went-well"),
  );
  const didntGoWell = createMemo(() =>
    cards().filter((card) => card.column === "didnt-go-well"),
  );

  return (
    <main class="mx-auto max-w-5xl p-6 pb-32">
      <Title>Retro Board - Solid 2 Retro Jam</Title>

      <header class="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Retro Board</h1>
          <p class="mt-1 text-sm text-muted">
            Two hours. Two windows. One board.
          </p>
        </div>

        <div
          class="flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-sm"
          style={{ "--who": `hsl(${me().hue} 70% 60%)` }}
        >
          <span
            class="inline-block size-2.5 rounded-full"
            style={{ background: `hsl(${me().hue} 70% 60%)` }}
          />
          <span>You are {me().name}</span>
        </div>
      </header>

      <section class="rounded-xl border border-dashed border-line p-10 text-center">
        <div class="grid grid-cols-3 gap-8">
          <Column type="went-well" cards={wentWell()} />
          <Column type="didnt-go-well" cards={didntGoWell()} />
          <Column type="action-items" cards={actionItems()} />
        </div>
        {/* <h2 class="mb-2 font-semibold">Nothing here yet — that is the point.</h2>
        <p class="mx-auto mb-6 max-w-md text-sm text-muted">
          Build the board described in <code class="text-white">SPEC.md</code>.
          Start by deciding what a card is and how the server hands you a list
          of them; the shape of every primitive you will need is on the
          playground.
        </p>
        <div class="flex flex-wrap justify-center gap-2 text-sm">
          <a
            href="/playground"
            class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface"
          >
            Open the playground
          </a>
          <a
            href="/users"
            class="rounded-lg border border-line px-4 py-2 font-medium text-muted hover:text-white"
          >
            Template's own server-function example
          </a>
        </div> */}
      </section>

      <p class="mt-8 text-center text-xs text-muted">
        Open the Chaos Panel (bottom right) and raise latency before you trust
        anything you build. At 0ms every async state in this app is invisible.
      </p>
    </main>
  );
}
