import type { Card } from "../server/db";

export function SkeletonCard() {
  return <div class="h-20 w-full bg-surface-2 rounded-sm is-pending"></div>;
}

export default function Card(props: { card: Card }) {
  const { card } = props;
  return (
    <article class="rounded-lg border border-line bg-surface p-3 text-sm">
      <p style={{ color: `hsl(${card.authorHue}, 70%, 60%)` }}>
        {card.authorName}
      </p>
      <p>{card.text}</p>
      <div>
        <button>{card.votes.length}</button>
      </div>
    </article>
  );
}
