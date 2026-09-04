import { For, Loading } from "solid-js";
import { SkeletonCard } from "./Card";

import type { Card } from "../server/db";
import CardComp from "./Card";

type Column = "went-well" | "didnt-go-well" | "action-items";

function Form() {
  return <form method="post"></form>;
}

export function Column(props: { type: Column; cards: Card[] }) {
  const { type, cards } = props;
  return (
    <div class="flex flex-col gap-2">
      <h2>{type}</h2>
      <Loading fallback={<SkeletonCard />}>
        <For each={cards} fallback={<p>no cards</p>}>
          {(card) => <CardComp card={card} />}
        </For>
      </Loading>
      <Form />
    </div>
  );
}
