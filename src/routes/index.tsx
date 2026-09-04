import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';

import Board from '../components/Board';
import { liveBoard, livePresence } from '../lib/board';
import { getMe } from '../lib/jam';

// REFERENCE SOLUTION.
//
// The preload starts these as navigation begins, and for the live queries it
// is also what warms the channel on a client-side navigation.
export const route = {
  preload: () => {
    void getMe();
    void liveBoard();
    void livePresence();
  },
} satisfies RouteDefinition;

export default function BoardRoute() {
  return (
    <main class="mx-auto max-w-5xl p-6 pb-32">
      <Title>Retro Board - Solid 2 Retro Jam</Title>
      <Board />
    </main>
  );
}
