import type { Card as CardType } from "../server/card";
import { useAction } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { removeCard, editCard } from "../lib/jam";

export function Card(props: { card: CardType }) {
  const deleteCard = useAction(removeCard);
  const editCardAction = useAction(editCard);

  const [editMode, setEditMode] = createSignal(false);
  const [formError, setFormError] = createSignal<string | null>(null);

  return (
    <div class="rounded-lg border border-line bg-surface p-3 text-sm">
      <p
        class="font-semibold"
        style={{ color: `hsl(${props.card.authorHue} 70% 60%)` }}
      >
        {props.card.authorName}
      </p>
      <hr class="border border-line w-full my-2" />
      <p class="mb-4">{props.card.text}</p>
      <div class="flex items-center gap-2">
        <Show
          when={editMode()}
          fallback={
            <button
              onClick={() => setEditMode(true)}
              class="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-white"
            >
              Edit
            </button>
          }
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const target = e.target as HTMLFormElement;
              try {
                await editCardAction({
                  text: fd.get("text") as string,
                  id: props.card.id,
                });
                setFormError(null);
              } catch (error) {
                if (error instanceof Error) {
                  setFormError(error.message);
                }
              }
            }}
          >
            <input
              type="text"
              name="text"
              // TODO: Add form input focus when the edit mode is enabled

              value={props.card.text}
              class="w-full rounded-lg border border-line bg-surface px-3 py-2"
            />
            <button
              type="submit"
              class="rounded-lg bg-accent px-4 py-2 font-semibold text-surface disabled:opacity-50"
            >
              {" "}
              Save{" "}
            </button>
          </form>
        </Show>

        <button
          onClick={() => deleteCard(props.card.id)}
          class="rounded-lg border border-line px-3 py-1.5 text-sm text-muted hover:text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
