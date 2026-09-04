import { Title } from '@solidjs/meta';
import { Errored, Loading, createMemo, createSignal, isPending, latest } from 'solid-js';

import { getEcho } from '../../lib/playground';

// ---------------------------------------------------------------------------
// ASYNC LIVES IN COMPUTATIONS
//
// There is no createResource, no <Suspense>, no startTransition, no
// useTransition, and no `resource.loading` / `resource.error`. A memo that
// returns a Promise IS the async primitive; boundaries handle the rest.
//
// Turn LATENCY up in the Chaos Panel before reading this page — at 0ms
// everything here is invisible.
// ---------------------------------------------------------------------------

export default function AsyncPlayground() {
  const [text, setText] = createSignal('hello');

  // Reading echoed() is "not ready" at first. That is not an error state —
  // it propagates to the nearest <Loading> boundary.
  const echoed = createMemo(() => getEcho(text()), { name: 'echo' });

  return (
    <section class="space-y-6">
      <Title>Async - Playground</Title>

      <div class="rounded-xl border border-line bg-surface-2 p-6">
        <label class="mb-2 block text-sm text-muted" for="echo-input">
          Type something. Type <code class="text-white">boom</code> to make the
          server throw.
        </label>
        <input
          id="echo-input"
          class="w-full rounded-lg border border-line bg-surface px-3 py-2 font-mono"
          value={text()}
          onInput={(event) => setText(event.currentTarget.value)}
        />
      </div>

      {/* <Loading> replaces <Suspense>. `on` re-shows the fallback when the
          key changes — without it, the previous value stays on screen during
          revalidation (usually what you want, occasionally not). */}
      <Panel title="<Loading on={text()}> — fallback returns on every key change">
        <Errored fallback={(error, reset) => <Failure error={error} reset={reset} />}>
          <Loading fallback={<Skeleton />} on={text()}>
            <output class="font-mono text-lg">{echoed()}</output>
          </Loading>
        </Errored>
      </Panel>

      {/* No `on`: once something has rendered, the boundary keeps it visible
          while the next value is in flight. isPending() is how you show that. */}
      <Panel title="<Loading> without `on` — previous value stays, isPending() marks it">
        <Errored fallback={(error, reset) => <Failure error={error} reset={reset} />}>
          <Loading fallback={<Skeleton />}>
            <output
              class={['font-mono text-lg', { 'is-pending': isPending(echoed) }]}
            >
              {echoed()}
            </output>
          </Loading>
        </Errored>
      </Panel>

      {/* latest() peeks at the in-flight value during a transition. */}
      <Panel title="latest() — what is being computed right now">
        <p class="font-mono text-sm text-muted">
          latest input: {latest(text)}
        </p>
      </Panel>

      <details class="rounded-xl border border-line bg-surface-2 p-5 text-sm">
        <summary class="cursor-pointer font-semibold">
          isPending() is not 1.x <code>resource.loading</code>
        </summary>
        <div class="mt-3 space-y-2 text-muted">
          <p>
            It is true while a value <em>change</em> is in flight — an input
            changed, or something declared <code class="text-white">affects()</code>{' '}
            on it. A bare <code class="text-white">refresh()</code> re-asks the
            same question and is deliberately silent.
          </p>
          <p>
            For a reload that should read as pending:{' '}
            <code class="text-white">affects(x); refresh(x)</code>. For a
            "saving…" affordance, use a co-written optimistic flag, not
            isPending.
          </p>
        </div>
      </details>
    </section>
  );
}

function Panel(props: { title: string; children?: unknown }) {
  return (
    <div class="rounded-xl border border-line bg-surface-2 p-6">
      <h2 class="mb-3 font-mono text-xs text-accent">{props.title}</h2>
      {props.children as never}
    </div>
  );
}

function Skeleton() {
  return <div class="is-pending h-6 w-40 rounded bg-line" />;
}

function Failure(props: { error: () => unknown; reset: () => void }) {
  return (
    <div class="space-y-2">
      <p class="text-sm text-didnt-go-well">{String(props.error())}</p>
      <button
        type="button"
        class="rounded-lg border border-line px-3 py-1 text-sm"
        onClick={() => props.reset()}
      >
        Retry
      </button>
    </div>
  );
}
