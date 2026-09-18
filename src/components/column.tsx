import type { Card as CardType, Column as ColumnType } from "../server/card";
import { createMemo, For, Loading, createSignal, Show } from "solid-js";
import { addNewCard } from "../lib/jam";
import { useAction } from "@solidjs/router";
import { Card } from "./card";

export default function Column(props: {
  cards: CardType[];
  column: ColumnType;
}) {
  const addNewCardSubmit = useAction(addNewCard);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [input, setInput] = createSignal<
    string | number | string[] | undefined
  >("");

  const columnName = props.column.split("-").join(" ");

  return (
    <section class="flex flex-col gap-3 rounded-xl border border-line bg-surface-2 p-4">
      <form
        method="post"
        class="flex items-center gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const target = e.target as HTMLFormElement;
          try {
            await addNewCardSubmit({
              text: fd.get("text") as string,
              column: props.column,
            });
            setFormError(null);
          } catch (error) {
            if (error instanceof Error) {
              setFormError(error.message);
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
      >
        <input
          name="text"
          type="text"
          placeholder="Add text here"
          class="w-full rounded-lg border border-line bg-surface px-3 py-2"
          value={input()}
          onInput={(e) => setInput(e.currentTarget.value)}
        />
        <button
          type="submit"
          class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface disabled:opacity-50"
        >
          {" "}
          Add{" "}
        </button>
      </form>
      <Show when={formError()}>
        <p class="is-reverted rounded-lg p-2 text-sm text-didnt-go-well">
          {formError()}
        </p>
      </Show>
      <h2 class="text-sm font-semibold tracking-wide text-muted uppercase">
        {columnName}
      </h2>
      <Loading fallback={<div>Loading...</div>}>
        <For fallback={<div>No cards currently</div>} each={props.cards}>
          {(card) => <Card card={card} />}
        </For>
      </Loading>
    </section>
  );
}
