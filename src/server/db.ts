// The data source, as a server-only module: importing it from code that
// could reach the client bundle fails the build (the `server-only` marker
// comes typed via @solidjs/vite-plugin/boundary-modules). Swap the Map for a
// real database client — this file is the only place that knows.
import "server-only";
import { createBus } from "./bus";
import { chaosRead, chaosWrite } from "./chaos";
import { randomUUID } from "node:crypto";

export type Column = "went-well" | "didnt-go-well" | "action-items";

export interface Card {
  id: string;
  column: Column;
  text: string;
  authorId: string; // from getMe() // id: 1, name: "Ada Lovelace", hue: 200
  authorName: string;
  authorHue: number;
  votes: string[]; // authorIds; one vote per person, toggleable
  createdAt: number;
  updatedAt: number;
}

export type AddCardInput = Pick<Card, "column" | "text">;

const cardsBus = createBus<Card[]>([]);

export function currentCards(): Card[] {
  return cardsBus.current();
}

export function subscribeCards(signal?: AbortSignal): AsyncIterable<Card[]> {
  return cardsBus.subscribe(signal);
}

export function watcherCount(): number {
  return cardsBus.subscriberCount();
}

export async function readCards() {
  await chaosRead();
  return cardsBus.current();
}

export async function addNewCard(card: Omit<Card, "id" | "updatedAt" | "createdAt">) {
  await chaosWrite(`card added by ${card.authorName}`);
  const latestCards = currentCards();
  const date = Date.now();
  const newCards = [
    ...latestCards,
    {
      ...card,
      id: randomUUID(),
      createdAt: date,
      updatedAt: date,
    },
  ];
  cardsBus.publish(newCards);
  return newCards;
}

export async function updateCardVotes(cardId: Card["id"], authorId: Card["authorId"]) {
  await chaosWrite(`vote incoming`);
  const latestCards = currentCards();
  const date = Date.now();
  const newCards = latestCards.map((card) => {
    if (card.id !== cardId) return card;
    if (card.votes.includes(authorId)) {
      return {
        ...card,
        votes: card.votes.filter((id) => authorId !== id),
        updatedAt: date
      }
    }
    return ({
      ...card,
      votes: [...card.votes, authorId],
      updatedAt: date
    })
  });
  cardsBus.publish(newCards);
  return newCards.find((card) => card.id === cardId);
}