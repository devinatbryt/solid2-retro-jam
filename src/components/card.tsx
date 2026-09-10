import type { Card as CardType } from "../server/card";

export function Card(props: CardType) {
  return (
    <div class="rounded-lg border border-line bg-surface p-3 text-sm">
        <span
          class="inline-block size-2.5 rounded-full"
          style={{ background: `hsl(${props.authorHue} 70% 60%)` }}
        >
          {props.authorName}
        </span>
        <div class="border border-line h-1 w-full my-2" />
        <p>{props.text}</p>
    </div>
  );
}
