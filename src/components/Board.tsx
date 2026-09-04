// REFERENCE SOLUTION — the board UI.
import { revalidate, useAction, useSubmissions } from '@solidjs/router';
import {
  For,
  Show,
  action,
  createEffect,
  createMemo,
  createOptimisticStore,
  createSignal,
  isPending,
  onSettled,
  untrack,
} from 'solid-js';

import {
  COLUMNS,
  COLUMN_ACCENTS,
  COLUMN_LABELS,
  type Card,
  type Column,
} from '../board-model';
import {
  addCard,
  deleteCard,
  editCard,
  liveBoard,
  livePresence,
  toggleVote,
} from '../lib/board';
import { getMe } from '../lib/jam';

export default function Board() {
  const me = createMemo(() => getMe(), { name: 'me' });

  // A hard SSR load serialises the first value and never pulls again, so the
  // channel has to be opened once after hydration. Client-side navigation
  // warms it through route.preload instead.
  onSettled(() => {
    revalidate(liveBoard.key);
    revalidate(livePresence.key);
  });

  // The live board, wrapped so optimistic writes can sit on top of it.
  // Tentative writes made inside an `action` are discarded when the
  // transaction settles — success or failure — leaving whatever the stream
  // has since delivered.
  // Read the live query through a memo. This indirection is NOT optional:
  // calling liveBoard() straight from JSX (or from the optimistic store's
  // compute) yields nothing and never updates. The memo is what subscribes.
  const board = createMemo(() => liveBoard(), { name: 'board' });
  const presence = createMemo(() => livePresence(), { name: 'presence' });

  // Optimistic writes layer on top of the live truth. A tentative write made
  // inside an `action` is discarded when the transaction settles, leaving
  // whatever the stream has since delivered — no rollback code anywhere.
  const [cards, setCards] = createOptimisticStore<Card[]>(() => board(), []);

  const [filter, setFilter] = createSignal('');
  const [error, setError] = createSignal<string | null>(null);

  const submitVote = useAction(toggleVote);

  const vote = action(async function* (cardId: string) {
    const myId = untrack(() => me().id);

    // Optimistic: flip the vote now. No rollback code below — a throw reverts
    // this automatically.
    setCards((list) => {
      const card = list.find((item) => item.id === cardId);
      if (!card) return;
      const index = card.votes.indexOf(myId);
      if (index >= 0) card.votes.splice(index, 1);
      else card.votes.push(myId);
    });

    yield submitVote(cardId);
  });

  const visible = createMemo(() => {
    const needle = filter().trim().toLowerCase();
    if (!needle) return cards;
    return cards.filter(
      (card) =>
        card.text.toLowerCase().includes(needle) ||
        card.authorName.toLowerCase().includes(needle),
    );
  });

  const runVote = (cardId: string) => {
    setError(null);
    void vote(cardId).catch((cause: unknown) => setError(String(cause)));
  };

  return (
    <div class="space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight">Retro Board</h1>
          <p class="mt-1 flex items-center gap-2 text-sm text-muted">
            <span
              class="inline-block size-2.5 rounded-full"
              style={{ background: `hsl(${me().hue} 70% 60%)` }}
            />
            You are {me().name}
            <span aria-live="polite">
              · {presence()} connected · {liveBoard.status()}
            </span>
          </p>
        </div>

        <input
          type="search"
          placeholder="Filter cards…"
          aria-label="Filter cards"
          class="w-56 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
          value={filter()}
          onInput={(event) => setFilter(event.currentTarget.value)}
        />
      </header>

      <Show when={error()}>
        {(message) => (
          <p class="is-reverted rounded-lg p-3 text-sm text-didnt-go-well" role="alert">
            {message()}
          </p>
        )}
      </Show>

      <div class="grid gap-4 md:grid-cols-3">
        <For each={COLUMNS}>
          {(column) => (
            <ColumnView
              column={column}
              cards={visible().filter((card) => card.column === column)}
              myId={me().id}
              onVote={runVote}
              onError={setError}
            />
          )}
        </For>
      </div>
    </div>
  );
}

function ColumnView(props: {
  column: Column;
  cards: Card[];
  myId: string;
  onVote: (cardId: string) => void;
  onError: (message: string | null) => void;
}) {
  // Renders every add currently in flight for THIS column, so a slow write
  // shows up as a real row instead of a spinner somewhere else.
  const pendingAdds = useSubmissions(
    addCard,
    (input) => input[0] === props.column,
  );

  return (
    <section
      class={[
        'flex flex-col gap-3 rounded-xl border border-line border-t-2 bg-surface-2 p-4',
        COLUMN_ACCENTS[props.column],
      ]}
    >
      <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">
        {COLUMN_LABELS[props.column]}
        <span class="ml-2 font-mono text-xs normal-case">{props.cards.length}</span>
      </h2>

      <For
        each={props.cards}
        fallback={
          <p class="rounded-lg border border-dashed border-line p-6 text-center text-sm text-muted">
            Nothing here yet.
          </p>
        }
      >
        {(card) => (
          <CardView
            card={card}
            myId={props.myId}
            onVote={props.onVote}
            onError={props.onError}
          />
        )}
      </For>

      {/* In-flight adds, rendered from the router's submission list. */}
      <For each={pendingAdds}>
        {(submission) => (
          // Submission has no `pending` flag: in flight means no result yet
          // and no error.
          <Show when={submission.result === undefined && !submission.error}>
            <article class="is-optimistic rounded-lg border border-line bg-surface p-3 text-sm">
              {String((submission.input[1] as FormData)?.get('text') ?? '')}
            </article>
          </Show>
        )}
      </For>

      <AddCardForm column={props.column} />
    </section>
  );
}

function CardView(props: {
  card: Card;
  myId: string;
  onVote: (cardId: string) => void;
  onError: (message: string | null) => void;
}) {
  const [editing, setEditing] = createSignal(false);
  const submitEdit = useAction(editCard);
  const submitDelete = useAction(deleteCard);

  const mine = createMemo(() => props.card.authorId === props.myId);
  const voted = createMemo(() => props.card.votes.includes(props.myId));

  return (
    <article
      class={[
        'rounded-lg border border-line bg-surface p-3 text-sm',
        { 'is-pending': isPending(() => props.card.updatedAt) },
      ]}
    >
      <Show
        when={editing()}
        fallback={<p class="mb-2 whitespace-pre-wrap">{props.card.text}</p>}
      >
        <form
          class="mb-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = String(
              new FormData(event.currentTarget).get('text') ?? '',
            );
            setEditing(false);
            props.onError(null);
            void submitEdit(props.card.id, text).catch((cause: unknown) =>
              props.onError(String(cause)),
            );
          }}
        >
          <input
            name="text"
            value={props.card.text}
            autofocus
            class="w-full rounded-lg border border-line bg-surface-2 px-2 py-1"
          />
        </form>
      </Show>

      <footer class="flex items-center justify-between gap-2 text-xs">
        <span class="flex items-center gap-1.5 text-muted">
          <span
            class="inline-block size-2 rounded-full"
            style={{ background: `hsl(${props.card.authorHue} 70% 60%)` }}
          />
          {props.card.authorName}
        </span>

        <span class="flex items-center gap-1">
          <Show when={mine()}>
            <button
              type="button"
              class="rounded px-1.5 py-0.5 text-muted hover:text-white"
              onClick={() => setEditing((value) => !value)}
            >
              {editing() ? 'cancel' : 'edit'}
            </button>
            <button
              type="button"
              class="rounded px-1.5 py-0.5 text-muted hover:text-didnt-go-well"
              onClick={() => {
                props.onError(null);
                void submitDelete(props.card.id).catch((cause: unknown) =>
                  props.onError(String(cause)),
                );
              }}
            >
              delete
            </button>
          </Show>

          <button
            type="button"
            aria-pressed={voted() ? 'true' : 'false'}
            aria-label={`${voted() ? 'Remove vote from' : 'Vote for'} "${props.card.text}"`}
            class={[
              'rounded-full border px-2 py-0.5 font-mono tabular-nums',
              voted()
                ? 'border-accent bg-accent/15 text-accent'
                : 'border-line text-muted hover:text-white',
            ]}
            onClick={() => props.onVote(props.card.id)}
          >
            ▲ {props.card.votes.length}
          </button>
        </span>
      </footer>
    </article>
  );
}

function AddCardForm(props: { column: Column }) {
  let input: HTMLInputElement | undefined;

  const submissions = useSubmissions(
    addCard,
    (submitted) => submitted[0] === props.column,
  );

  // Clear the field once the submission has actually been REGISTERED, not in
  // the submit handler.
  //
  // Clearing in onSubmit (even via queueMicrotask) races the router's own
  // FormData capture: the input goes empty before the action reads it and the
  // server receives a blank card. Watching the submissions list means the
  // arguments are already captured by the time we touch the DOM.
  createEffect(
    () => submissions.length,
    () => {
      if (!input) return;
      input.value = '';
      input.focus();
    },
    { defer: true },
  );

  return (
    <form
      // .with() pre-binds the column, so the action still works as a plain
      // form post before hydration.
      action={addCard.with(props.column)}
      method="post"
      class="flex gap-2"
    >
      <input
        ref={(element) => (input = element)}
        name="text"
        required
        maxlength="280"
        placeholder="Add a card…"
        class="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
      />
      <button
        type="submit"
        class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-surface"
      >
        Add
      </button>
    </form>
  );
}
