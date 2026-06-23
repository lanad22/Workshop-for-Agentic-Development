import { describe, it, expect } from 'vitest';
import type { BingoCard } from '../types';
import { generateCard } from './cardGenerator';
import { checkForBingo, countFilled, getClosestToWin } from './bingoChecker';

/** A real card with everything cleared except the (always-filled) free space. */
function freshCard(): BingoCard {
  const card = generateCard('agile');
  return {
    ...card,
    squares: card.squares.map((row) => row.map((sq) => ({ ...sq, isFilled: sq.isFreeSpace }))),
  };
}

function fill(card: BingoCard, ids: string[]): BingoCard {
  const set = new Set(ids);
  return {
    ...card,
    squares: card.squares.map((row) =>
      row.map((sq) => (set.has(sq.id) ? { ...sq, isFilled: true } : sq)),
    ),
  };
}

describe('checkForBingo', () => {
  it('returns null for a card with only the free space', () => {
    expect(checkForBingo(freshCard())).toBeNull();
  });

  it('detects all 5 rows', () => {
    for (let r = 0; r < 5; r++) {
      const ids = [0, 1, 2, 3, 4].map((c) => `${r}-${c}`);
      const line = checkForBingo(fill(freshCard(), ids));
      expect(line).toEqual(expect.objectContaining({ type: 'row', index: r }));
    }
  });

  it('detects all 5 columns', () => {
    for (let c = 0; c < 5; c++) {
      const ids = [0, 1, 2, 3, 4].map((r) => `${r}-${c}`);
      const line = checkForBingo(fill(freshCard(), ids));
      expect(line).toEqual(expect.objectContaining({ type: 'column', index: c }));
    }
  });

  it('detects both diagonals', () => {
    const main = checkForBingo(fill(freshCard(), [0, 1, 2, 3, 4].map((i) => `${i}-${i}`)));
    expect(main).toEqual(expect.objectContaining({ type: 'diagonal', index: 0 }));

    const anti = checkForBingo(fill(freshCard(), [0, 1, 2, 3, 4].map((i) => `${i}-${4 - i}`)));
    expect(anti).toEqual(expect.objectContaining({ type: 'diagonal', index: 1 }));
  });

  it('counts the free space toward a line (middle row needs only its 4 other squares)', () => {
    // 2-2 is the pre-filled free space; fill only the other four of row 2.
    const line = checkForBingo(fill(freshCard(), ['2-0', '2-1', '2-3', '2-4']));
    expect(line).toEqual(expect.objectContaining({ type: 'row', index: 2 }));
  });
});

describe('countFilled / getClosestToWin', () => {
  it('countFilled excludes the free space', () => {
    expect(countFilled(freshCard())).toBe(0);
    expect(countFilled(fill(freshCard(), ['0-0', '0-1']))).toBe(2);
  });

  it('reports one-away when a line needs a single square', () => {
    const oneAway = fill(freshCard(), ['0-0', '0-1', '0-2', '0-3']); // row 0 missing 0-4
    const closest = getClosestToWin(oneAway);
    expect(closest?.needed).toBe(1);
  });
});
