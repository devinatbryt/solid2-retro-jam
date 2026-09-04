// Who is this? — without a login screen.
//
// The first time a browser touches the server it gets a nickname and a hue,
// stored in the signed session cookie. That is enough to make the live demo
// legible ("Grumpy Wombat added a card" beats a card appearing from nowhere)
// and enough to enforce one-vote-per-person without building auth.
//
// Deliberately NOT security. The cookie is signed, so it cannot be forged,
// but anyone can clear it and become someone new. That is fine for a retro.
import 'server-only';

import { getSession, setSession } from './session';

export interface Identity {
  id: string;
  name: string;
  /** 0-359. Use as `hsl(${hue} 70% 60%)` or a CSS custom property. */
  hue: number;
}

const ADJECTIVES = [
  'Grumpy', 'Caffeinated', 'Reluctant', 'Feral', 'Punctual', 'Nocturnal',
  'Suspicious', 'Unbothered', 'Ambitious', 'Sleepy', 'Meticulous', 'Chaotic',
];

const ANIMALS = [
  'Wombat', 'Heron', 'Otter', 'Badger', 'Pangolin', 'Marmot',
  'Kestrel', 'Axolotl', 'Ferret', 'Capybara', 'Narwhal', 'Ibex',
];

function pick<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)]!;
}

/**
 * The current visitor, minting one on first contact.
 *
 * Note the sequencing: `setSession` writes to the OUTGOING response, and
 * `getSession` reads the INCOMING request — so a freshly minted identity is
 * not readable via getSession() until the next request. That is why this
 * returns the value it just created rather than re-reading it.
 *
 * Call this from page renders and ordinary server functions. Do NOT rely on
 * it minting inside a streaming live source: a stream's headers are long gone
 * by the time the second value is yielded.
 */
export async function getIdentity(): Promise<Identity> {
  const session = await getSession();

  if (session?.jamId && session.jamName && typeof session.jamHue === 'number') {
    return { id: session.jamId, name: session.jamName, hue: session.jamHue };
  }

  const minted: Identity = {
    id: crypto.randomUUID(),
    name: `${pick(ADJECTIVES)} ${pick(ANIMALS)}`,
    hue: Math.floor(Math.random() * 360),
  };

  await setSession({
    ...session,
    jamId: minted.id,
    jamName: minted.name,
    jamHue: minted.hue,
  });

  return minted;
}
