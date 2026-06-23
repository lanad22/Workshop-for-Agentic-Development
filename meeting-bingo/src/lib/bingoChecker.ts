// src/lib/bingoChecker.ts
// Pure win-detection + progress helpers. The free space is just a filled square,
// so it naturally counts toward the middle row, middle column, and both diagonals.

import type { BingoCard, BingoSquare, WinningLine } from '../types';

const INDICES = [0, 1, 2, 3, 4];

/** All 12 lines as arrays of squares, with a human-readable name. */
function allLines(squares: BingoSquare[][]): { name: string; squares: BingoSquare[] }[] {
  return [
    ...squares.map((row, i) => ({ name: `Row ${i + 1}`, squares: row })),
    ...INDICES.map((col) => ({
      name: `Column ${col + 1}`,
      squares: squares.map((row) => row[col]),
    })),
    { name: 'Diagonal ↘', squares: INDICES.map((i) => squares[i][i]) },
    { name: 'Diagonal ↙', squares: INDICES.map((i) => squares[i][4 - i]) },
  ];
}

/**
 * Return the first complete winning line (5 rows, 5 columns, 2 diagonals),
 * or null. Free space counts because it is `isFilled`.
 */
export function checkForBingo(card: BingoCard): WinningLine | null {
  const { squares } = card;

  for (let row = 0; row < 5; row++) {
    if (squares[row].every((sq) => sq.isFilled)) {
      return { type: 'row', index: row, squares: squares[row].map((sq) => sq.id) };
    }
  }

  for (let col = 0; col < 5; col++) {
    if (squares.every((row) => row[col].isFilled)) {
      return { type: 'column', index: col, squares: squares.map((row) => row[col].id) };
    }
  }

  if (INDICES.every((i) => squares[i][i].isFilled)) {
    return { type: 'diagonal', index: 0, squares: INDICES.map((i) => `${i}-${i}`) };
  }

  if (INDICES.every((i) => squares[i][4 - i].isFilled)) {
    return { type: 'diagonal', index: 1, squares: INDICES.map((i) => `${i}-${4 - i}`) };
  }

  return null;
}

/** Human-readable name for a winning line (for the win screen). */
export function describeLine(line: WinningLine | null): string | null {
  if (!line) return null;
  if (line.type === 'row') return `Row ${line.index + 1}`;
  if (line.type === 'column') return `Column ${line.index + 1}`;
  return line.index === 0 ? 'Diagonal ↘' : 'Diagonal ↙';
}

/** Count of filled squares EXCLUDING the free space (the "X/24" numerator). */
export function countFilled(card: BingoCard): number {
  return card.squares.flat().filter((sq) => sq.isFilled && !sq.isFreeSpace).length;
}

/** Total fillable (non-free) squares — always 24. */
export const TOTAL_FILLABLE = 24;

export interface ClosestLine {
  needed: number; // squares still required to complete this line (1–4)
  name: string;
  squares: string[]; // ids of all squares on the line (for highlight)
}

/**
 * The line closest to completion that is not already complete, for the
 * "One away!" hint and potential-winning-line highlight. Returns null when no
 * partial line exists (fresh card with only the free space) or on a win.
 */
export function getClosestToWin(card: BingoCard): ClosestLine | null {
  let closest: ClosestLine | null = null;

  for (const line of allLines(card.squares)) {
    const filled = line.squares.filter((sq) => sq.isFilled).length;
    const needed = 5 - filled;
    if (needed > 0 && (closest === null || needed < closest.needed)) {
      closest = { needed, name: line.name, squares: line.squares.map((sq) => sq.id) };
    }
  }

  return closest;
}
