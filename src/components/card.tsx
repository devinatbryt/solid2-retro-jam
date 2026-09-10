import type { Card as CardType } from "../server/card";

export function Card(props: { card: CardType }) {
  return (
    <div class="rounded-lg border border-line bg-surface p-3 text-sm">
      <span
        class="inline-block size-2.5 rounded-full"
        style={{ background: `hsl(${props.card.authorHue} 70% 60%)` }}
      >
        {props.card.authorName}
      </span>
      <div class="border border-line h-1 w-full my-2" />
      <p>{props.card.text}</p>
    </div>
  );
}
