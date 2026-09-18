import {
  For,
  Loading,
  createSignal,
  createStore,
  Show,
} from "solid-js";
import { SkeletonCard } from "./Card";
import { addCard } from "../lib/cards";

import type { Card, Column } from "../server/db";
import CardComp from "./Card";
import { useAction } from "@solidjs/router";

function NewCardForm(props: { type: Column }) {
  const submit = useAction(addCard);
  const [error, setError] = createSignal<string | null>(null);
  const [text, setText] = createStore<{ value: string, isPending: boolean }>({ value: "", isPending: false });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setText((previous) => { previous.isPending = true })
          await submit({
            text: text.value,
            column: props.type,
          });
          setText((previous) => ({ ...previous, value: "", isPending: false }));
          setError(null);
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
            setText((previous) => { previous.isPending = false })
          }
        }
      }}
      method="post"
    >
      <input
        class={["w-full rounded-lg border border-line bg-surface px-3 py-2", {
          "is-pending": text.isPending
        }]}
        disabled={text.isPending}
        type="text"
        value={text.value}
        onInput={(e) => setText((previous) => { previous.value = e.target.value })}
        name="text"
      />
      <Show when={error()}>
        <p class="is-reverted rounded-lg p-2 text-sm text-didnt-go-well mt-4">
          {error()}
        </p>
      </Show>
    </form>
  );
}

export function Column(props: { type: Column; cards: Card[] }) {
  return (
    <div class="flex flex-col gap-2">
      <h2>{props.type}</h2>
      <Loading fallback={<SkeletonCard />}>
        <For each={props.cards} fallback={<p>no cards</p>}>
          {(card) => <CardComp card={card} />}
        </For>
      </Loading>
      <NewCardForm type={props.type} />
    </div>
  );
}
