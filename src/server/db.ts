// The data source, as a server-only module: importing it from code that
// could reach the client bundle fails the build (the `server-only` marker
// comes typed via @solidjs/vite-plugin/boundary-modules). Swap the Map for a
// real database client — this file is the only place that knows.
import "server-only";
import { createBus } from "./bus";
import { chaosRead, chaosWrite } from "./chaos";
import { randomUUID } from "node:crypto";
export interface User {
  name: string;
  title: string;
}

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

export type AddCardInput = Omit<Card, "id" | "votes">;

const users = new Map<string, User>([
  ["1", { name: "Ada Lovelace", title: "Wrote the first program" }],
  ["2", { name: "Grace Hopper", title: "Invented the compiler" }],
  ["3", { name: "Margaret Hamilton", title: "Took Apollo to the moon" }],
]);

export function listUsers() {
  return Array.from(users, ([id, user]) => ({ id, ...user }));
}

export function findUser(id: string) {
  return users.get(id);
}

export function updateUser(id: string, data: Partial<User>) {
  const user = users.get(id);
  if (user) users.set(id, { ...user, ...data });
}

// const didntGoWell = new Map<string, Card>([
//   [
//     "1",
//     {
//       text: "sloppy",
//       authorId: "1",
//       authorName: "Ada Lovelace",
//       authorHue: 200,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "2",
//     {
//       text: "tdd is no fun",
//       authorId: "2",
//       authorName: "Grace Hopper",
//       authorHue: 100,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "3",
//     {
//       text: "Improve documentation, just kidding... imperfection.",
//       authorId: "3",
//       authorName: "Margaret Hamilton",
//       authorHue: 300,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
// ]);

// const wentWell = new Map<string, Card>([
//   [
//     "1",
//     {
//       text: "the codebase wins",
//       authorId: "1",
//       authorName: "Ada Lovelace",
//       authorHue: 200,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "2",
//     {
//       text: "Add unit tests never. all good!",
//       authorId: "2",
//       authorName: "Grace Hopper",
//       authorHue: 100,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "3",
//     {
//       text: "Improve documentation, just kidding... perfection.",
//       authorId: "3",
//       authorName: "Margaret Hamilton",
//       authorHue: 300,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
// ]);

// const actionItems = new Map<string, Card>([
//   [
//     "1",
//     {
//       text: "Refactor the codebase",
//       authorId: "1",
//       authorName: "Ada Lovelace",
//       authorHue: 200,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "2",
//     {
//       text: "Add unit tests",
//       authorId: "2",
//       authorName: "Grace Hopper",
//       authorHue: 100,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
//   [
//     "3",
//     {
//       text: "Improve documentation",
//       authorId: "3",
//       authorName: "Margaret Hamilton",
//       authorHue: 300,
//       votes: [],
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//     },
//   ],
// ]);

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

export async function addNewCard(card: AddCardInput) {
  await chaosWrite(`card added by ${card.authorName}`);
  const latestCards = currentCards();
  const newCards = [
    ...latestCards,
    {
      ...card,
      id: randomUUID(),
      votes: [],
    },
  ];
  cardsBus.publish(newCards);
  return newCards;
}

// export function listActionItems() {
//   return Array.from(actionItems, ([id, card]) => ({ id, ...card }));
// }

// export function listWentWell() {
//   return Array.from(wentWell, ([id, card]) => ({ id, ...card }));
// }

// export function listDidntGoWell() {
//   return Array.from(didntGoWell, ([id, card]) => ({ id, ...card }));
// }

// { id: authorId, name: authorName, hue: authorHue, text, votes: [] } how it is
// { authorId: id, authorName: name, authorHue: hue, text, votes: [] } how it must be
// type Data = {
//   text: string;
//   id: string;
//   name: string;
//   hue: number;
//   votes: string[];
// };

// export function postActionItem(data: Data) {
//   const id = (actionItems.size + 1).toString();
// }
