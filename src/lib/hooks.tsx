import {
  createOptimisticStore,
  action,
  createMemo,
  refresh,
  createContext,
  useContext,
  type Refreshable,
  createEffect,
  onSettled,
  untrack,
} from "solid-js";
import { addCard, getCards, updateCardVote } from "./cards";
import  type {AddCardInput, Card } from "../server/db";
import { getMe } from "./jam";
import { revalidate, useAction } from "@solidjs/router";
import type { JSX } from "@solidjs/web/jsx-runtime";

interface OptimisticCardActions {
  add: (card: AddCardInput) => Promise<void>;
  updateVote: (id: string) => Promise<void>;
}
type OptimisticCardsCtx = readonly [
  Refreshable<readonly Card[]>,
  OptimisticCardActions,
];

const OptimisticCardContext = createContext<OptimisticCardsCtx>();

const createOptimisticCards = () => {
  onSettled(() => {
    revalidate(getCards.key);
  });
  const identity = createMemo(() => getMe());
  const liveCards = createMemo(getCards)
  const [cards, setCards] = createOptimisticStore<Card[]>(() => liveCards(), []);
  const addCardAction = useAction(addCard);
  const updateCardVotesAction = useAction(updateCardVote)

  const add = action(async function* (card: AddCardInput) {
    const me = untrack(identity)
    setCards((cardList) => {
      cardList.push({
        ...card,
        authorId: me.id,
        authorHue: me.hue,
        authorName: me.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: [],
        id: crypto.randomUUID(),
      });
    });
    yield addCardAction(card);
    refresh(cards)
  });

  const updateVote = action(async function* (cardId: string) {
    const me = untrack(identity)
    setCards(cardList => {
      for (const card of cardList) {
        if (card.id !== cardId) continue;
        const authorIndex = card.votes.indexOf(me.id);
        card.updatedAt = Date.now()
        if (authorIndex >= 0) {
          card.votes.splice(authorIndex)
          break;
        }
        card.votes.push(me.id)
        break;
      }
    });
    yield updateCardVotesAction(cardId);
    refresh(cards)
  })

  return [cards, { add, updateVote }] as OptimisticCardsCtx;
};

export const useOptimisticCards = () => {
  const ctx = useContext(OptimisticCardContext);
  if (!ctx) {
    throw new Error("Context not found");
  }
  return ctx;
};

export const OptimisticCardsProvider = (props: { children: JSX.Element }) => {
  const value = createOptimisticCards();

  return (
    <OptimisticCardContext value={value}>
      {props.children}
    </OptimisticCardContext>
  );
};
