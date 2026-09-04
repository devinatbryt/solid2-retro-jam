// Server functions for the playground's toy domain.
//
// Same three declaration styles you will need on the board:
//   query(...)      — a cached read, keyed, revalidated after actions settle
//   liveQuery(...)  — a keyed LIVE read; one shared connection per key
//   action(...)     — a write; the router revalidates queries when it settles
import { action, liveQuery, query } from '@solidjs/router';
import { getRequestEvent } from '@solidjs/web';

import { getIdentity } from '../server/identity';
import { isLiveConnection } from '../server/live';
import {
  currentTicker,
  echo,
  pushNudge,
  readTicker,
  subscribeTicker,
  watcherCount,
  type TickerState,
} from '../server/ticker';

/** Plain cached read. Re-fetches only when something revalidates it. */
export const getTicker = query(async () => {
  'use server';
  return readTicker();
}, 'ticker');

/**
 * The same data as a LIVE read.
 *
 * Compare with getTicker above — the consumer code is almost identical
 * (`createMemo(() => liveTicker())`), but this one keeps yielding.
 */
export const liveTicker = liveQuery(async function* () {
  'use server';
  // SSR renders the first value and abandons the generator — subscribing here
  // would leak one subscriber per page render. See src/server/live.ts.
  if (!isLiveConnection()) {
    yield currentTicker();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const state of subscribeTicker(signal)) {
    yield state;
  }
}, 'live-ticker');

/** How many live streams are currently open. Poor man's presence. */
export const liveWatchers = liveQuery(async function* () {
  'use server';
  if (!isLiveConnection()) {
    yield watcherCount();
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  // Piggy-backs on the ticker bus: every publish re-reports the count.
  for await (const _ of subscribeTicker(signal)) {
    void _;
    yield watcherCount();
  }
}, 'live-watchers');

/** A write. Chaos-guarded, so it can be slow and it can fail. */
export const nudge = action(async () => {
  'use server';
  const me = await getIdentity();
  return pushNudge(me.name);
}, 'nudge');

/** A slow parameterised read — say "boom" to make it throw. */
export const getEcho = query(async (text: string) => {
  'use server';
  return echo(text);
}, 'echo');

/** Non-live snapshot used as the optimistic store's source of truth. */
export const getNudges = query(async () => {
  'use server';
  await readTicker();
  return currentTicker().nudges;
}, 'nudges');

export type { TickerState };
export type { Nudge } from '../server/ticker';
