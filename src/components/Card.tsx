import type { Card } from "../server/db";

export function SkeletonCard() {
  return <div class="animate-pulse h-[100px] w-full rounded-sm"></div>;
}

export default function Card(props: { card: Card }) {
  const { card } = props;
  return (
    <div>
      <p style={{ color: `hsl(${card.authorHue}, 70%, 60%)` }}>
        {card.authorName}
      </p>
      <p>{card.text}</p>
      <div>
        <button>{card.votes.length}</button>
      </div>
    </div>
  );
}
