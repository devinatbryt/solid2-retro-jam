import {
  For,
  Loading,
  createMemo,
  createSignal,
  Show,
  Errored,
} from "solid-js";
import { SkeletonCard } from "./Card";
import { getMe } from "../lib/jam";
import { addCard, getCards } from "../lib/cards";

import type { Card, Column } from "../server/db";
import CardComp from "./Card";
import { useAction, revalidate } from "@solidjs/router";

function Form(props: { type: Column }) {
  const me = createMemo(() => getMe());
  const submit = useAction(addCard);
  const [error, setError] = createSignal<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const target = e.target as HTMLFormElement;
        const formData = new FormData(target);
        try {
          await submit({
            text: formData.get("text") as string,
            column: formData.get("column") as Column,
            authorId: formData.get("authorId") as string,
            authorHue: Number(formData.get("authorHue")),
            authorName: formData.get("authorName") as string,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          revalidate(getCards.key);
          setError(null);
        } catch (e) {
          if (e instanceof Error) {
            setError(e.message);
          }
        } finally {
          const textInput = Array.from(target.elements).find(
            (element) => element.getAttribute("name") === "text",
          ) as HTMLInputElement | null;
          if (textInput) {
            textInput.value = "";
            queueMicrotask(() => {
              textInput.focus();
            });
          }
        }
      }}
      method="post"
    >
      <input
        class="w-full rounded-lg border border-line bg-surface px-3 py-2"
        type="text"
        name="text"
      />
      <Show when={error()}>
        <p class="is-reverted rounded-lg p-2 text-sm text-didnt-go-well mt-4">
          {error()}
        </p>
      </Show>
      <input type="hidden" name="column" value={props.type} />
      <input type="hidden" name="authorId" value={me().id} />
      <input type="hidden" name="authorHue" value={me().hue} />
      <input type="hidden" name="authorName" value={me().name} />
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
      <Form type={props.type} />
    </div>
  );
}
