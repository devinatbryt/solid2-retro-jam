// REFERENCE SOLUTION — the board's data layer.
//
// One module-scope store, one bus. Every mutation publishes the whole board,
// because live sources are value-shaped: each yield REPLACES the previous
// value rather than appending an event.
import 'server-only';

import { COLUMNS, type Card, type Column } from '../board-model';
import { createBus } from './bus';
import { chaosRead, chaosWrite } from './chaos';
import type { Identity } from './identity';

export type { Card, Column };

function seed(): Card[] {
  const now = Date.now();
  return [
    {
      id: 'seed-1',
      column: 'went-well',
      text: 'We shipped the thing without a single rollback.',
      authorId: 'seed',
      authorName: 'Punctual Heron',
      authorHue: 150,
      votes: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'seed-2',
      column: 'didnt-go-well',
      text: 'Standup ran to forty minutes again.',
      authorId: 'seed',
      authorName: 'Reluctant Badger',
      authorHue: 20,
      votes: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

const boardBus = createBus<Card[]>(seed());

export function currentBoard(): Card[] {
  return boardBus.current();
}

export function subscribeBoard(signal?: AbortSignal): AsyncIterable<Card[]> {
  return boardBus.subscribe(signal);
}

export function boardWatchers(): number {
  return boardBus.subscriberCount();
}

export async function readBoard(): Promise<Card[]> {
  await chaosRead();
  return boardBus.current();
}

function assertColumn(value: string): Column {
  const column = COLUMNS.find((c) => c === value);
  if (!column) throw new Error(`Unknown column "${value}"`);
  return column;
}

/**
 * Validation lives HERE, not in the form. The UI hiding a disabled button is
 * courtesy; this is the actual gate.
 */
export async function addCard(
  me: Identity,
  columnInput: string,
  textInput: string,
): Promise<Card[]> {
  const column = assertColumn(columnInput);
  const text = textInput.trim();
  if (!text) throw new Error('A card needs some text.');
  if (text.length > 280) throw new Error('Keep it under 280 characters.');

  await chaosWrite(`add card to ${column}`);

  const now = Date.now();
  const card: Card = {
    id: crypto.randomUUID(),
    column,
    text,
    authorId: me.id,
    authorName: me.name,
    authorHue: me.hue,
    votes: [],
    createdAt: now,
    updatedAt: now,
  };

  boardBus.publish([...boardBus.current(), card]);
  return boardBus.current();
}

/** Toggles this person's vote. Idempotent per person, so double-clicks are safe. */
export async function toggleVote(me: Identity, cardId: string): Promise<Card[]> {
  await chaosWrite(`vote on ${cardId}`);

  boardBus.publish(
    boardBus.current().map((card) => {
      if (card.id !== cardId) return card;
      const voted = card.votes.includes(me.id);
      return {
        ...card,
        votes: voted
          ? card.votes.filter((id) => id !== me.id)
          : [...card.votes, me.id],
        updatedAt: Date.now(),
      };
    }),
  );

  return boardBus.current();
}

export async function editCard(
  me: Identity,
  cardId: string,
  textInput: string,
): Promise<Card[]> {
  const text = textInput.trim();
  if (!text) throw new Error('A card needs some text.');

  const existing = boardBus.current().find((card) => card.id === cardId);
  if (!existing) throw new Error('That card is gone.');
  if (existing.authorId !== me.id) throw new Error('You can only edit your own cards.');

  await chaosWrite(`edit ${cardId}`);

  boardBus.publish(
    boardBus.current().map((card) =>
      card.id === cardId ? { ...card, text, updatedAt: Date.now() } : card,
    ),
  );

  return boardBus.current();
}

export async function deleteCard(me: Identity, cardId: string): Promise<Card[]> {
  const existing = boardBus.current().find((card) => card.id === cardId);
  if (!existing) return boardBus.current();
  if (existing.authorId !== me.id) throw new Error('You can only delete your own cards.');

  await chaosWrite(`delete ${cardId}`);
  boardBus.publish(boardBus.current().filter((card) => card.id !== cardId));
  return boardBus.current();
}
