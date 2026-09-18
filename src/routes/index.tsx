import { Title } from "@solidjs/meta";
import type { RouteDefinition } from "@solidjs/router";
import { createMemo } from "solid-js";
import { getCards } from "../lib/jam";
import { getMe } from "../lib/jam";
import Column from "../components/column";

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

export default function RetroBoard() {
  // A server function read. `getMe` is a query(): cached per key, revalidated
  // by the router after an action settles. It mints a nickname on first visit.
  const me = createMemo(() => getMe());
  const cards = createMemo(getCards);
  const wentWell = createMemo(() =>
    cards().filter((card) => card.column === "went-well"),
  );

  const didntGoWell = createMemo(() =>
    cards().filter((card) => card.column === "didnt-go-well"),
  );

  const actionItems = createMemo(() =>
    cards().filter((card) => card.column === "action-items"),
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

      <div class="grid md:grid-cols-3 gap-4">
        <Column cards={wentWell()} column="went-well" />
        <Column cards={didntGoWell()} column="didnt-go-well" />
        <Column cards={actionItems()} column="action-items" />
      </div>
    </main>
  );
}
