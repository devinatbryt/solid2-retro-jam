// The Chaos Panel. Pre-built infrastructure — you should not need to touch it.
//
// It exists because localhost is a liar: every server function resolves in
// about a millisecond, so <Loading> fallbacks never paint, isPending is never
// true long enough to see, optimistic writes are indistinguishable from real
// ones, and <Errored> never fires. Turn latency up and all four become
// obvious. Turn failure up and watch optimistic writes revert.
//
// It is also a worked example of a live read: the settings come down a
// liveQuery stream, so moving a slider in one window moves it in the other.
import { createEffect, createMemo, createSignal, onSettled } from 'solid-js';
import { revalidate, useAction } from '@solidjs/router';

import { liveChaos, updateChaos } from '../lib/jam';

export default function ChaosPanel() {
  const submit = useAction(updateChaos);

  // The live read. One shared connection per key across every consumer.
  const chaos = createMemo(() => liveChaos(), { name: 'chaos-settings' });

  // Open the channel after hydration. On a hard page load the SSR render
  // pulled the first value and serialised it; the browser adopts that value
  // and never pulls, so without this the stream sits at "connecting" forever
  // and the panel stops agreeing across windows. Client-side navigation warms
  // the channel through route preload instead and does not need this.
  onSettled(() => {
    revalidate(liveChaos.key);
  });

  // Local slider positions. A control bound directly to a 2000ms round-trip
  // is unusable, so the slider moves now and the stream corrects it later.
  const [latency, setLatency] = createSignal(0);
  const [failure, setFailure] = createSignal(0);

  // Two-arg createEffect: compute phase TRACKS, apply phase runs the side
  // effect untracked. The single-argument 1.x form no longer exists.
  // NOTE the braces: whatever the apply phase RETURNS is treated as a
  // cleanup function, so `(v) => setLatency(v)` is a type error, not a style
  // choice. Return nothing, or return a teardown.
  createEffect(
    () => chaos().latencyMs,
    (value) => {
      setLatency(value);
    },
  );
  createEffect(
    () => chaos().failureRate,
    (value) => {
      setFailure(value);
    },
  );

  return (
    <aside class="fixed right-4 bottom-4 z-50 w-72 rounded-xl border border-line bg-surface-2/95 p-4 text-left text-sm shadow-2xl backdrop-blur">
      <header class="mb-3 flex items-center justify-between">
        <h2 class="font-semibold tracking-tight">Chaos Panel</h2>
        <ConnectionDot />
      </header>

      <label class="mb-1 flex items-center justify-between text-muted" for="chaos-latency">
        <span>Latency</span>
        <span class="tabular-nums text-white">{latency()}ms</span>
      </label>
      <input
        id="chaos-latency"
        type="range"
        min="0"
        max="3000"
        step="100"
        class="mb-4 w-full accent-accent"
        value={latency()}
        onInput={(event) => {
          const latencyMs = event.currentTarget.valueAsNumber;
          setLatency(latencyMs);
          void submit({ latencyMs });
        }}
      />

      <label class="mb-1 flex items-center justify-between text-muted" for="chaos-failure">
        <span>Write failure</span>
        <span class="tabular-nums text-white">{Math.round(failure() * 100)}%</span>
      </label>
      <input
        id="chaos-failure"
        type="range"
        min="0"
        max="1"
        step="0.05"
        class="w-full accent-didnt-go-well"
        value={failure()}
        onInput={(event) => {
          const failureRate = event.currentTarget.valueAsNumber;
          setFailure(failureRate);
          void submit({ failureRate });
        }}
      />

      <p class="mt-3 text-xs text-muted">
        Reads get latency only. Writes get latency <em>and</em> may be rejected.
      </p>
    </aside>
  );
}

/** Live-stream connection state, straight off the liveQuery handle. */
function ConnectionDot() {
  const status = createMemo(() => liveChaos.status());

  return (
    <span class="flex items-center gap-1.5 text-xs text-muted">
      <span
        class={[
          'inline-block size-2 rounded-full',
          {
            'bg-went-well': status() === 'connected',
            'bg-action-items is-pending': status() === 'connecting' || status() === 'reconnecting',
            'bg-didnt-go-well': status() === 'closed' || status() === 'idle',
          },
        ]}
      />
      {status()}
    </span>
  );
}
