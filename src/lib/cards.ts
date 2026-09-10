import { query, liveQuery, action } from "@solidjs/router";
import {
  readCards,
  addNewCard,
  type AddCardInput,
  currentCards,
  subscribeCards,
} from "../server/db";
import { getRequestEvent } from "@solidjs/web";

import { getIdentity } from "../server/identity";
import { isLiveConnection } from "../server/live";
import { chaosRead } from "../server/chaos";

export const getCards = liveQuery(async function* () {
  "use server";
  // SSR: hand back the first value without subscribing (see src/server/live.ts).
  if (!isLiveConnection()) {
    yield readCards();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const cards of subscribeCards(signal)) {
    await chaosRead();
    yield cards;
  }
}, "get-cards");

export const addCard = action(async (next: AddCardInput) => {
  "use server";
  if (next.text.trim() === "") throw new Error("Text input is empty");
  return addNewCard(next);
}, "add-card");
