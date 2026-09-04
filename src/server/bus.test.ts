// Unit tests for the fan-out bus — the one piece of infrastructure the whole
// live demo rests on. Runs in the `server` vitest project (node environment).
import { describe, expect, test } from 'vitest';

import { createBus } from './bus';

/** Pull `count` values out of an async iterable. */
async function take<T>(source: AsyncIterable<T>, count: number): Promise<T[]> {
  const out: T[] = [];
  for await (const value of source) {
    out.push(value);
    if (out.length === count) break;
  }
  return out;
}

describe('createBus', () => {
  test('hands a new subscriber the current value before any update', async () => {
    const bus = createBus({ count: 7 });
    const [first] = await take(bus.subscribe(), 1);
    expect(first).toEqual({ count: 7 });
  });

  test('every subscriber sees a published value (this is the fan-out)', async () => {
    const bus = createBus(0);

    const a = take(bus.subscribe(), 2);
    const b = take(bus.subscribe(), 2);
    // Let both generators reach their first suspension point.
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));

    bus.publish(1);

    expect(await a).toEqual([0, 1]);
    expect(await b).toEqual([0, 1]);
  });

  test('releases the subscriber when the consumer aborts', async () => {
    const bus = createBus(0);
    const controller = new AbortController();

    const stream = bus.subscribe(controller.signal);
    const iterator = stream[Symbol.asyncIterator]();
    await iterator.next();
    expect(bus.subscriberCount()).toBe(1);

    // Abandoning the iterator is what a disconnecting browser looks like.
    await iterator.return?.();
    expect(bus.subscriberCount()).toBe(0);
  });

  test('publish replaces the value rather than queueing events', async () => {
    const bus = createBus('a');
    bus.publish('b');
    bus.publish('c');
    const [first] = await take(bus.subscribe(), 1);
    // A late subscriber gets current state, not the history. Live sources are
    // value-shaped: each yield REPLACES the last.
    expect(first).toBe('c');
  });
});

describe('createBus reaping', () => {
  test('an abandoned subscriber is released without an abort signal', async () => {
    // No AbortSignal at all — the case a closed browser or a finished SSR
    // render leaves behind. Without the heartbeat this generator would sit
    // parked forever and subscriberCount() would never come back down.
    const bus = createBus(0, { heartbeatMs: 20 });

    const iterator = bus.subscribe()[Symbol.asyncIterator]();
    await iterator.next();
    expect(bus.subscriberCount()).toBe(1);

    // Abandon it: queue a return while it is parked mid-await.
    const returned = iterator.return?.();
    await new Promise((resolve) => setTimeout(resolve, 80));
    await returned;

    expect(bus.subscriberCount()).toBe(0);
  });
});
