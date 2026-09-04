import { Title } from '@solidjs/meta';
import { useAction } from '@solidjs/router';
// NOTE: `action` is exported by BOTH solid-js and @solidjs/router, with
// different signatures. The shared name is deliberate — the router's is a
// specialisation of this one — but you must know which you imported.
//   solid-js        action(function* () {...})  → client transaction, reverts
//   @solidjs/router action(async fn, 'name')    → form-bindable server action
import { For, Show, action, createMemo, createOptimisticStore, createSignal, refresh } from 'solid-js';

import { getNudges, nudge, type Nudge } from '../../lib/playground';

// ---------------------------------------------------------------------------
// OPTIMISTIC WRITES
//
// Set FAILURE RATE to ~50% and LATENCY to ~1500ms in the Chaos Panel, then
// press the button repeatedly. Successful writes settle into the list;
// rejected ones vanish again on their own. You write no rollback code.
// ---------------------------------------------------------------------------

export default function OptimisticPlayground() {
  // An optimistic store over an async source. Writes applied inside an action
  // are tentative: they show immediately and are discarded when the
  // transaction settles, leaving whatever the source now says.
  const [nudges, setNudges] = createOptimisticStore<Nudge[]>(
    () => getNudges(),
    [],
  );

  const send = useAction(nudge);
  const [error, setError] = createSignal<string | null>(null);
  // A "saving…" affordance is a co-written flag, NOT isPending(). isPending
  // is about a value change being in flight, which is a different question.
  const [saving, setSaving] = createSignal(false);

  const addNudge = action(async function* () {
    const optimistic: Nudge = {
      id: `optimistic-${crypto.randomUUID()}`,
      by: 'you (optimistic)',
      at: Date.now(),
    };

    // Tentative write — visible immediately, reverted automatically on throw.
    setNudges((list) => {
      list.unshift(optimistic);
    });

    // `yield` is the transaction-safe suspension point. A plain `await` is
    // fine for getting a typed result, but any write AFTER an await escapes
    // the transaction unless you put a bare `yield` in front of it first.
    yield send();

    // Re-ask the source of truth. Bare refresh() is quiet by design:
    // isPending stays false because it is the same question, not a new one.
    yield refresh(nudges);
  });

  const optimisticCount = createMemo(
    () => nudges.filter((item) => item.id.startsWith('optimistic-')).length,
  );

  return (
    <section class="space-y-6">
      <Title>Optimistic - Playground</Title>

      <div class="rounded-xl border border-line bg-surface-2 p-6">
        <button
          type="button"
          class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface disabled:opacity-50"
          onClick={() => {
            setError(null);
            setSaving(true);
            void addNudge()
              .catch((cause: unknown) => setError(String(cause)))
              .finally(() => setSaving(false));
          }}
        >
          Nudge optimistically
        </button>

        <span class="ml-3 text-sm text-muted">
          <Show when={saving()} fallback="idle">
            <span class="is-pending">saving…</span>
          </Show>
        </span>

        <Show when={error()}>
          {(message) => (
            <p class="is-reverted mt-3 rounded-lg p-2 text-sm text-didnt-go-well">
              {message()} — the optimistic row above reverted itself.
            </p>
          )}
        </Show>
      </div>

      <div class="rounded-xl border border-line bg-surface-2 p-6">
        <h2 class="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
          <span>Nudges</span>
          <span class="font-mono text-xs">
            {optimisticCount()} unconfirmed
          </span>
        </h2>

        <For
          each={nudges}
          fallback={<p class="text-sm text-muted">Nothing yet.</p>}
        >
          {(item) => (
            <div
              class={[
                'flex items-center justify-between rounded-lg px-2 py-2 text-sm',
                { 'is-optimistic': item.id.startsWith('optimistic-') },
              ]}
            >
              <span>{item.by}</span>
              <span class="font-mono text-xs text-muted">
                {new Date(item.at).toLocaleTimeString()}
              </span>
            </div>
          )}
        </For>
      </div>

      <details class="rounded-xl border border-line bg-surface-2 p-5 text-sm">
        <summary class="cursor-pointer font-semibold">
          The await / yield trap
        </summary>
        <pre class="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-xs text-muted">
{`const save = action(async function* (text) {
  setThing(s => { s.text = text });   // optimistic, inside the transaction
  const saved = await api.save(text); // typed result — fine
  yield;                              // ← WITHOUT THIS, the write below
  setThing(s => { s.id = saved.id }); //   escapes and commits immediately
});`}
        </pre>
        <p class="mt-3 text-muted">
          The runtime cannot hook an async generator's internal await
          continuations, so it cannot keep writes after an{' '}
          <code class="text-white">await</code> inside the transaction. Also:
          never call <code class="text-white">flush()</code> inside an action —
          it drains the transaction mid-step.
        </p>
      </details>
    </section>
  );
}
