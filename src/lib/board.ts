// REFERENCE SOLUTION — the board's server functions.
import { action, liveQuery, query } from '@solidjs/router';
import { getRequestEvent } from '@solidjs/web';

import {
  addCard as addCardOnServer,
  boardWatchers,
  currentBoard,
  deleteCard as deleteCardOnServer,
  editCard as editCardOnServer,
  readBoard,
  subscribeBoard,
  toggleVote as toggleVoteOnServer,
} from '../server/board';
import type { Card, Column } from '../board-model';
import { getIdentity } from '../server/identity';
import { isLiveConnection } from '../server/live';

/** Non-live read. Useful as an optimistic store's source, and for preloads. */
export const getBoard = query(async () => {
  'use server';
  return readBoard();
}, 'board');

/**
 * The board as a live read. Every mutation publishes the whole array, so each
 * yield is a complete replacement — which is exactly the shape live sources
 * require.
 */
export const liveBoard = liveQuery(async function* () {
  'use server';
  // During SSR the renderer takes one value and abandons this generator; if we
  // subscribed here it would never be released. See src/server/live.ts.
  if (!isLiveConnection()) {
    yield currentBoard();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const cards of subscribeBoard(signal)) {
    yield cards;
  }
}, 'live-board');

/** How many people are looking at the board right now. */
export const livePresence = liveQuery(async function* () {
  'use server';
  if (!isLiveConnection()) {
    yield boardWatchers();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const _ of subscribeBoard(signal)) {
    void _;
    yield boardWatchers();
  }
}, 'live-presence');

/**
 * Form-bindable add. Takes FormData so `<form action={addCard.with(column)}>`
 * works before hydration.
 */
export const addCard = action(async (column: string, formData: FormData) => {
  'use server';
  const me = await getIdentity();
  return addCardOnServer(me, column, String(formData.get('text') ?? ''));
}, 'add-card');

export const toggleVote = action(async (cardId: string) => {
  'use server';
  const me = await getIdentity();
  return toggleVoteOnServer(me, cardId);
}, 'toggle-vote');

export const editCard = action(async (cardId: string, text: string) => {
  'use server';
  const me = await getIdentity();
  return editCardOnServer(me, cardId, text);
}, 'edit-card');

export const deleteCard = action(async (cardId: string) => {
  'use server';
  const me = await getIdentity();
  return deleteCardOnServer(me, cardId);
}, 'delete-card');

export type { Card, Column };
