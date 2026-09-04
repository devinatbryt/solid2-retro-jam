// Telling an SSR render apart from a real live connection.
//
// A live server function is invoked in two quite different situations:
//
//   1. During the SSR page render, to produce the FIRST value that gets
//      serialised into the HTML. The renderer pulls exactly one value and then
//      abandons the generator.
//   2. From the browser, as a GET to /_server/data/<id>, which is the actual
//      long-lived stream.
//
// Case 1 must not subscribe to anything. An abandoned generator is suspended
// at its `yield` — it never reaches the rest of the loop, so its `finally`
// never runs and any subscription it registered is held forever. That is a
// genuine, unbounded leak: one per page render.
//
// So: on the server render, yield current state once and return. The browser
// opens the real stream a moment later.
import 'server-only';

import { getRequestEvent } from '@solidjs/web';

export function isLiveConnection(): boolean {
  const url = getRequestEvent()?.request.url;
  if (!url) return false;
  return new URL(url).pathname.startsWith('/_server/');
}
