// The fan-out layer. Solid does NOT provide this.
//
// `live()` / `liveQuery()` give you a per-client stream with reconnection and
// SSR adoption — but the docs are explicit: "No broadcast: Each client call
// creates separate connections—no automatic data sharing across users." So
// every connected browser gets its own async generator, and something has to
// hand all of them the same value. That something is this file.
//
// Contract (matches what live sources require):
//   * VALUE-shaped, not event-shaped. Each published value REPLACES the last.
//   * A new subscriber is handed the current value immediately, before any
//     update. Live sources must re-yield current state on every invocation.
//   * Latest-wins. A slow consumer skips intermediate values rather than
//     building a backlog.
import 'server-only';

export interface Bus<T> {
  /** Replace the current value and wake every subscriber. */
  publish(value: T): void;
  /** Current value, without subscribing. */
  current(): T;
  /** Yields the current value immediately, then each subsequent value. */
  subscribe(signal?: AbortSignal): AsyncIterable<T>;
  /** How many streams are open right now. Handy for a presence indicator. */
  subscriberCount(): number;
}

/**
 * How long a parked subscriber waits before waking up to check whether it is
 * still wanted.
 *
 * This is not a nicety, it is a leak fix. A suspended async generator cannot
 * process a pending `.return()` while it is parked on a promise that never
 * settles — so a consumer that simply goes away (browser closed, SSR render
 * finished with the stream abandoned) would keep its subscription forever. The
 * abort signal covers the well-behaved case; this covers the rest.
 */
const HEARTBEAT_MS = 15_000;

export interface BusOptions {
  /** Override the reaper interval. Mostly for tests. */
  heartbeatMs?: number;
}

export function createBus<T>(initial: T, options: BusOptions = {}): Bus<T> {
  const heartbeatMs = options.heartbeatMs ?? HEARTBEAT_MS;
  let current = initial;
  // Monotonic version, so a subscriber can tell "nothing new yet" from
  // "a value equal to the last one was published".
  let version = 0;
  let subscribers = 0;
  const waiters = new Set<() => void>();

  function publish(value: T): void {
    current = value;
    version++;
    // Copy first: waking a waiter lets its generator run and re-register.
    const waking = [...waiters];
    waiters.clear();
    for (const wake of waking) wake();
  }

  async function* subscribe(signal?: AbortSignal): AsyncIterable<T> {
    subscribers++;
    // One abort hookup for the whole stream, not one per loop iteration.
    let onAbort: (() => void) | undefined;
    const abortPromise = signal
      ? new Promise<void>((resolve) => {
          onAbort = () => resolve();
          signal.addEventListener('abort', onAbort, { once: true });
        })
      : undefined;

    try {
      // -1 guarantees the first iteration yields current state immediately.
      let seen = -1;
      while (!signal?.aborted) {
        if (seen !== version) {
          seen = version;
          yield current;
          continue;
        }
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            waiters.delete(wake);
            clearTimeout(timer);
            resolve();
          };
          const wake = () => finish();
          // Heartbeat: resuming the generator is what lets a queued .return()
          // actually run. Waking on a timer costs one loop iteration and no
          // yield, because `seen === version` still holds.
          const timer = setTimeout(finish, heartbeatMs);
          timer.unref?.();
          waiters.add(wake);
          if (abortPromise) void abortPromise.then(finish);
        });
      }
    } finally {
      // Runs on normal return AND when the client disconnects — iterating a
      // server function's stream aborts here, so cleanup is not optional.
      subscribers--;
      if (onAbort && signal) signal.removeEventListener('abort', onAbort);
    }
  }

  return {
    publish,
    current: () => current,
    subscribe,
    subscriberCount: () => subscribers,
  };
}
