// REFERENCE SOLUTION — server-side rules.
//
// These cover the paths the UI deliberately hides, which is exactly why they
// need testing: the board never renders an edit button on someone else's card,
// so the only thing standing between a hand-crafted request and someone else's
// card is the check in src/server/board.ts.
import { beforeEach, describe, expect, test } from 'vitest';

import {
  addCard,
  currentBoard,
  deleteCard,
  editCard,
  toggleVote,
} from './board';
import { setChaos } from './chaos';
import type { Identity } from './identity';

const ada: Identity = { id: 'ada', name: 'Ada Lovelace', hue: 200 };
const grace: Identity = { id: 'grace', name: 'Grace Hopper', hue: 40 };

async function freshCard(text = 'a card') {
  const cards = await addCard(ada, 'went-well', text);
  return cards[cards.length - 1]!;
}

beforeEach(() => {
  // Chaos is process-wide; a stray failure rate would make these flaky.
  setChaos({ latencyMs: 0, failureRate: 0 });
});

describe('addCard', () => {
  test('rejects empty text on the SERVER, not just in the form', async () => {
    await expect(addCard(ada, 'went-well', '   ')).rejects.toThrow(/needs some text/i);
  });

  test('rejects text over 280 characters', async () => {
    await expect(addCard(ada, 'went-well', 'x'.repeat(281))).rejects.toThrow(/280/);
  });

  test('rejects an unknown column', async () => {
    await expect(addCard(ada, 'not-a-column', 'hi')).rejects.toThrow(/Unknown column/);
  });

  test('trims and stamps authorship', async () => {
    const card = await freshCard('  hello  ');
    expect(card.text).toBe('hello');
    expect(card.authorId).toBe('ada');
    expect(card.authorName).toBe('Ada Lovelace');
    expect(card.votes).toEqual([]);
  });

  test('a rejected write leaves the board untouched', async () => {
    const before = currentBoard().length;
    setChaos({ failureRate: 1 });
    await expect(addCard(ada, 'went-well', 'should not land')).rejects.toThrow();
    setChaos({ failureRate: 0 });
    expect(currentBoard()).toHaveLength(before);
  });
});

describe('toggleVote', () => {
  test('is one vote per person and toggles', async () => {
    const card = await freshCard('votable');

    let board = await toggleVote(ada, card.id);
    expect(board.find((c) => c.id === card.id)!.votes).toEqual(['ada']);

    // Double-voting must not stack — this is what makes the optimistic
    // toggle safe to fire repeatedly.
    board = await toggleVote(ada, card.id);
    expect(board.find((c) => c.id === card.id)!.votes).toEqual([]);
  });

  test('counts two different people separately', async () => {
    const card = await freshCard('popular');
    await toggleVote(ada, card.id);
    const board = await toggleVote(grace, card.id);
    expect(board.find((c) => c.id === card.id)!.votes.sort()).toEqual(['ada', 'grace']);
  });

  test('anyone may vote on anyone else\'s card', async () => {
    const card = await freshCard('not mine');
    const board = await toggleVote(grace, card.id);
    expect(board.find((c) => c.id === card.id)!.votes).toEqual(['grace']);
  });
});

describe('editCard', () => {
  test('the author may edit', async () => {
    const card = await freshCard('before');
    const board = await editCard(ada, card.id, 'after');
    expect(board.find((c) => c.id === card.id)!.text).toBe('after');
  });

  test('someone else may NOT edit, even though the UI hides the button', async () => {
    const card = await freshCard('mine');
    await expect(editCard(grace, card.id, 'hijacked')).rejects.toThrow(/your own/i);
    expect(currentBoard().find((c) => c.id === card.id)!.text).toBe('mine');
  });

  test('rejects empty text', async () => {
    const card = await freshCard('keep me');
    await expect(editCard(ada, card.id, '  ')).rejects.toThrow(/needs some text/i);
    expect(currentBoard().find((c) => c.id === card.id)!.text).toBe('keep me');
  });

  test('rejects a card that no longer exists', async () => {
    await expect(editCard(ada, 'gone', 'x')).rejects.toThrow(/gone/i);
  });

  test('bumps updatedAt', async () => {
    const card = await freshCard('tick');
    await new Promise((resolve) => setTimeout(resolve, 2));
    const board = await editCard(ada, card.id, 'tock');
    expect(board.find((c) => c.id === card.id)!.updatedAt).toBeGreaterThan(card.updatedAt);
  });
});

describe('deleteCard', () => {
  test('the author may delete', async () => {
    const card = await freshCard('temporary');
    const board = await deleteCard(ada, card.id);
    expect(board.find((c) => c.id === card.id)).toBeUndefined();
  });

  test('someone else may NOT delete', async () => {
    const card = await freshCard('protected');
    await expect(deleteCard(grace, card.id)).rejects.toThrow(/your own/i);
    expect(currentBoard().find((c) => c.id === card.id)).toBeDefined();
  });

  test('deleting something already gone is a no-op, not a throw', async () => {
    await expect(deleteCard(ada, 'never-existed')).resolves.toBeDefined();
  });
});
