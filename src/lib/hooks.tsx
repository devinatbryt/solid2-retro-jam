import {
  createOptimisticStore,
  action,
  createMemo,
  refresh,
  createContext,
  Store,
  useContext,
  Refreshable,
} from "solid-js";
import { addCard, getCards } from "./cards";
import { AddCardInput, Card } from "../server/db";
import { getMe } from "./jam";
import { useAction } from "@solidjs/router";
import { JSX } from "@solidjs/web/jsx-runtime";

interface OptimisticCardActions {
  add: (card: AddCardInput) => Promise<void>;
}
type OptimisticCardsCtx = readonly [
  Refreshable<readonly Card[]>,
  OptimisticCardActions,
];

const OptimisticCardContext = createContext<OptimisticCardsCtx>();

export const createOptimisticCards = () => {
  const identity = createMemo(() => getMe());
  const [cards, setCards] = createOptimisticStore(() => getCards(), []);
  const addCardAction = useAction(addCard);

  const add = action(function* (card: AddCardInput) {
    setCards((cardList) => {
      cardList.push({
        ...card,
        authorId: identity().id,
        authorHue: identity().hue,
        authorName: identity().name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        votes: [],
        id: crypto.randomUUID(),
      });
    });
    yield addCardAction(card);
    refresh(cards);
  });

  return [cards, { add }] as OptimisticCardsCtx;
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
