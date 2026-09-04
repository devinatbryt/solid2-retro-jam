// REFERENCE SOLUTION — the shared vocabulary.
//
// Deliberately NOT server-only and deliberately importing nothing: both the
// server module and the components need these, and a value re-exported from a
// `server-only` module would drag that module into the client bundle and fail
// the build.
export const COLUMNS = ['went-well', 'didnt-go-well', 'action-items'] as const;
export type Column = (typeof COLUMNS)[number];

export const COLUMN_LABELS: Record<Column, string> = {
  'went-well': 'Went well',
  'didnt-go-well': "Didn't go well",
  'action-items': 'Action items',
};

export const COLUMN_ACCENTS: Record<Column, string> = {
  'went-well': 'border-t-went-well',
  'didnt-go-well': 'border-t-didnt-go-well',
  'action-items': 'border-t-action-items',
};

export interface Card {
  id: string;
  column: Column;
  text: string;
  authorId: string;
  authorName: string;
  authorHue: number;
  /** authorIds. One vote per person, toggleable. */
  votes: string[];
  createdAt: number;
  updatedAt: number;
}
