// Session-wide plumbing the jam needs but nobody should have to build:
// who you are, and the chaos knobs. The retro board itself is NOT here —
// that is yours to write.
//
// Everything below is a server function. On the server these are plain calls;
// in the browser the compiler rewrites each into a typed fetch. The
// `../server/*` modules they import are `server-only` and never reach the
// client bundle.
import { action, liveQuery, query } from '@solidjs/router';
import { getRequestEvent } from '@solidjs/web';

import { chaosBus, getChaos, setChaos, type ChaosSettings } from '../server/chaos';
import { getIdentity } from '../server/identity';
import { isLiveConnection } from '../server/live';
import { readCards, addNewCard as _addNewCard, editCard as _editCard, removeCard as _removeCard, subscribeToCards, type AddNewCardInput } from '../server/card';

/**
 * Who am I? Minted on first contact, then stable for this browser.
 * `query` caches per key and the router revalidates it after actions settle.
 */
export const getMe = query(async () => {
  'use server';
  return getIdentity();
}, 'me');

/**
 * The chaos settings, as a LIVE read — change them in one window and every
 * other window's panel moves too.
 *
 * Three things here are the whole pattern for a live source:
 *
 *  1. It is an async GENERATOR. Each yield replaces the previous value
 *     (value-shaped, not event-shaped).
 *  2. The bus hands over current state before any update, because a live
 *     source must re-yield current state on every invocation — reconnects
 *     and late subscribers depend on it.
 *  3. It passes `request.signal` down. When the browser stops iterating, the
 *     request aborts, the generator's `finally` runs, and the subscriber is
 *     released. Skip this and every reconnect leaks a listener.
 */
export const liveChaos = liveQuery(async function* () {
  'use server';
  // SSR: hand back the first value without subscribing (see src/server/live.ts).
  if (!isLiveConnection()) {
    yield getChaos();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const settings of chaosBus.subscribe(signal)) {
    yield settings;
  }
}, 'chaos');

/** Non-live read, for code that just wants the current numbers once. */
export const getChaosSettings = query(async () => {
  'use server';
  return getChaos();
}, 'chaos-snapshot');

/** Move a knob. Broadcasts to every open window through the bus. */
export const updateChaos = action(async (next: Partial<ChaosSettings>) => {
  'use server';
  return setChaos(next);
}, 'update-chaos');

export const getCards = liveQuery(async function* () {
  'use server';
  if (!isLiveConnection()) {
    yield readCards();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const cards of subscribeToCards(signal)) {
    yield cards
  }
}, 'get-cards');

export const addNewCard = action(async (card: AddNewCardInput) => {
  'use server';
  return _addNewCard(card)
}, 'add-new-card');



export type { ChaosSettings };
