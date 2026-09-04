import { Title } from '@solidjs/meta';
import { revalidate, useAction, type RouteDefinition } from '@solidjs/router';
import { For, Show, createMemo, createSignal, onSettled } from 'solid-js';

import { liveTicker, nudge } from '../../lib/playground';

// ---------------------------------------------------------------------------
// LIVE READS
//
// Open this page in two windows. Press the button in one; the other moves.
//
// The whole trick is three pieces:
//   1. src/server/bus.ts       — fan-out. Solid does NOT provide this.
//   2. src/lib/playground.ts   — liveQuery(async function* () { 'use server' })
//   3. this file               — createMemo(() => liveTicker())
//
// Note what is NOT here: no websocket, no polling, no subscription lifecycle,
// no useEffect-shaped cleanup. Reading the memo is the subscription.
// ---------------------------------------------------------------------------

// Calling a live query under PRELOAD intent is what opens the channel. Without
// this, hydration adopts the SSR-serialised first value and the memo never
// re-pulls — you get one value, forever, and status() sits at "connecting".
export const route = {
  preload: () => {
    void liveTicker();
  },
} satisfies RouteDefinition;

export default function LivePlayground() {
  // One shared connection per (name + args) key across every consumer in the
  // app — mounting this memo twice does not open two streams. Count and state
  // ride the SAME channel: a second key would be a second socket, and with two
  // windows open there are not that many sockets to spend (see lib/playground).
  const feed = createMemo(() => liveTicker(), { name: 'live-ticker' });

  // On a HARD page load the route preload ran on the server, so nothing in the
  // browser has pulled yet — hydration adopts the serialised first value and
  // the channel never opens. One real pull after hydration connects it.
  // (Client-side navigation into this route does not need this: preload runs
  // in the browser and warms the channel itself.)
  onSettled(() => {
    revalidate(liveTicker.key);
  });

  const send = useAction(nudge);
  const [error, setError] = createSignal<string | null>(null);
  const [sending, setSending] = createSignal(false);

  return (
    <section class="space-y-6">
      <Title>Live - Playground</Title>

      <div class="rounded-xl border border-line bg-surface-2 p-6">
        <div class="mb-4 flex items-baseline justify-between">
          <span class="text-sm text-muted">Shared count</span>
          <span class="font-mono text-4xl tabular-nums">{feed().state.count}</span>
        </div>

        <div class="mb-4 flex items-center gap-3 text-xs text-muted">
          <span>
            stream: <span class="text-white">{liveTicker.status()}</span>
          </span>
          <span>
            open streams: <span class="text-white">{feed().watchers}</span>
          </span>
        </div>

        <button
          type="button"
          class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface disabled:opacity-50"
          disabled={sending()}
          onClick={() => {
            // Writes belong in event handlers. Writing a signal from a
            // component body or a memo throws in dev (REACTIVE_WRITE_IN_OWNED_SCOPE).
            setError(null);
            setSending(true);
            void send()
              .catch((cause: unknown) => setError(String(cause)))
              .finally(() => setSending(false));
          }}
        >
          {sending() ? 'Nudging…' : 'Nudge'}
        </button>

        <Show when={error()}>
          {(message) => (
            <p class="is-reverted mt-3 rounded-lg p-2 text-sm text-didnt-go-well">
              {message()}
            </p>
          )}
        </Show>
      </div>

      <div class="rounded-xl border border-line bg-surface-2 p-6">
        <h2 class="mb-3 text-sm font-semibold text-muted">Recent nudges</h2>
        {/* Default <For> is keyed by identity: the callback gets a RAW item
            and an index ACCESSOR. With keyed={false} it is the other way
            round. <Index> no longer exists. */}
        <For
          each={feed().state.nudges}
          fallback={<p class="text-sm text-muted">Nothing yet.</p>}
        >
          {(item, index) => (
            <div class="flex items-center justify-between border-b border-line/50 py-2 text-sm last:border-0">
              <span>{item.by}</span>
              <span class="font-mono text-xs text-muted">#{index()}</span>
            </div>
          )}
        </For>
      </div>

      <details class="rounded-xl border border-line bg-surface-2 p-5 text-sm">
        <summary class="cursor-pointer font-semibold">
          Why does the other window update?
        </summary>
        <div class="mt-3 space-y-2 text-muted">
          <p>
            It does not, by itself. Solid's live sources are per-client: the
            docs say plainly that each client call opens a separate connection
            with no automatic sharing.
          </p>
          <p>
            <code class="text-white">src/server/bus.ts</code> is what makes them
            agree. Every open stream subscribes to one module-scope bus; a write
            publishes once and every subscriber wakes. Delete that file and each
            window would happily stream its own private reality.
          </p>
        </div>
      </details>
    </section>
  );
}
