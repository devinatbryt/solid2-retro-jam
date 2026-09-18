import { query, liveQuery, action } from "@solidjs/router";
import {
  readCards,
  addNewCard,
  type AddCardInput,
  subscribeCards,
  updateCardVotes
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
  const identity = await getIdentity();
  return addNewCard({
    ...next,
    votes: [],
    authorName: identity.name,
    authorHue: identity.hue,
    authorId: identity.id,
  });
}, "add-card");

export const updateCardVote = action(async (cardId: string) => {
  "use server";
  if (!cardId) throw new Error("Card id is required!");
  const {id: authorId} = await getIdentity();
  return updateCardVotes(cardId, authorId)
}, "update-card-vote")
