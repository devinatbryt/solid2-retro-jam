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

/** What one yield of the live ticker channel carries. */
export interface TickerFeed {
  state: TickerState;
  /** Open streams on the ticker bus. Poor man's presence. */
  watchers: number;
}

/**
 * The same data as a LIVE read, plus the watcher count, as ONE value.
 *
 * Compare with getTicker above — the consumer code is almost identical
 * (`createMemo(() => liveTicker())`), but this one keeps yielding.
 *
 * Why one channel and not two: state and watcher count used to be separate
 * liveQuery keys, and a key is a CONNECTION. Both were driven by the same bus
 * and woke on the same publishes, so the second one bought nothing and cost a
 * socket. That matters here — a dev server speaks HTTP/1.1, a browser allows
 * about six connections per origin, and this jam is meant to be run in two
 * windows side by side. At three streams per window (these two plus the chaos
 * panel's) two windows saturate the cap, and everything afterwards — server
 * function calls included — sits in the browser's queue and never dispatches.
 * It looks exactly like a hang.
 *
 * The lesson generalises to the board: keep the number of liveQuery KEYS
 * small. One channel carrying a composite value beats one channel per readout.
 */
export const liveTicker = liveQuery(async function* (): AsyncGenerator<TickerFeed> {
  'use server';
  // SSR renders the first value and abandons the generator — subscribing here
  // would leak one subscriber per page render. See src/server/live.ts.
  if (!isLiveConnection()) {
    yield { state: currentTicker(), watchers: watcherCount() };
    return;
  }
  const signal = getRequestEvent()?.request.signal;
  for await (const state of subscribeTicker(signal)) {
    // Count read at yield time, so every publish re-reports it — which is all
    // the second channel ever did.
    yield { state, watchers: watcherCount() };
  }
}, 'live-ticker');

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
