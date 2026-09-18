import type { Card } from "../server/db";
import { updateCardVote } from "../lib/cards";
import { getMe } from "../lib/jam";
import { createMemo } from "solid-js";
import { useAction } from "@solidjs/router";

export function SkeletonCard() {
  return <div class="h-20 w-full bg-surface-2 rounded-sm is-pending"></div>;
}

export default function Card(props: { card: Card }) {
  const me = createMemo(() => getMe())
  const hasVoted = createMemo(() => props.card.votes.includes(me().id))

  const submitVoteAction = useAction(updateCardVote);

  return (
    <article class="rounded-lg border border-line bg-surface p-3 text-sm">
      <p style={{ color: `hsl(${props.card.authorHue}, 70%, 60%)` }}>
        {props.card.authorName}
      </p>
      <p>{props.card.text}</p>
      <div>
        <button class={[
          'rounded-full border px-2 py-0.5 font-mono tabular-nums',
          hasVoted()
            ? 'border-accent bg-accent/15 text-accent'
            : 'border-line text-muted hover:text-white',
        ]} onClick={async () => {
          try {
            await submitVoteAction(props.card.id)
          } catch (err) {
            console.error(err)
          }
        }}>{props.card.votes.length}</button>
      </div>
    </article>
  );
}
