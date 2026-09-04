// The playground's toy domain: a shared counter and a short log of nudges.
//
// Deliberately NOT the retro board. The playground shows you the SHAPE of each
// Solid 2 primitive; mapping those shapes onto cards, columns and votes is the
// exercise. If you find yourself copying this file into your board, stop —
// you are copying the part that was meant to be thrown away.
import 'server-only';

import { createBus } from './bus';
import { chaosRead, chaosWrite } from './chaos';

export interface Nudge {
  id: string;
  by: string;
  at: number;
}

export interface TickerState {
  count: number;
  nudges: Nudge[];
}

const tickerBus = createBus<TickerState>({ count: 0, nudges: [] });

export function currentTicker(): TickerState {
  return tickerBus.current();
}

export function subscribeTicker(signal?: AbortSignal): AsyncIterable<TickerState> {
  return tickerBus.subscribe(signal);
}

export function watcherCount(): number {
  return tickerBus.subscriberCount();
}

/** Read with latency applied, so <Loading> has something to show. */
export async function readTicker(): Promise<TickerState> {
  await chaosRead();
  return tickerBus.current();
}

/**
 * Write with latency AND a chance of rejection.
 *
 * chaosWrite() runs BEFORE any state change: when it throws, the server is
 * untouched, so the only thing that needs undoing is the client's optimistic
 * value. Guard first, mutate second — always.
 */
export async function pushNudge(by: string): Promise<TickerState> {
  await chaosWrite(`nudge by ${by}`);

  const previous = tickerBus.current();
  const next: TickerState = {
    count: previous.count + 1,
    nudges: [{ id: crypto.randomUUID(), by, at: Date.now() }, ...previous.nudges].slice(0, 8),
  };

  tickerBus.publish(next);
  return next;
}

/** A slow read that echoes its input — for demonstrating latest() and isPending(). */
export async function echo(text: string): Promise<string> {
  await chaosRead();
  if (text.trim().toLowerCase() === 'boom') {
    throw new Error(`echo refused to say "${text}"`);
  }
  return text.toUpperCase();
}
