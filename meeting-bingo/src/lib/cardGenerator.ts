// src/lib/cardGenerator.ts
// Card generation (Fisher-Yates) + the word→squareId index used by auto-fill.

import type { BingoCard, BingoSquare, CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';

export const FREE_SPACE_WORD = 'FREE';

/** Fisher-Yates shuffle — returns a new shuffled array, does not mutate input. */
function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a fresh 5×5 bingo card for a category: 24 unique words + a center
 * FREE space (row 2, col 2) that starts filled.
 */
export function generateCard(categoryId: CategoryId): BingoCard {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) throw new Error(`Unknown category: ${categoryId}`);

  const selectedWords = shuffle(category.words).slice(0, 24);
  const now = Date.now();

  const squares: BingoSquare[][] = [];
  let wordIndex = 0;

  for (let row = 0; row < 5; row++) {
    const rowSquares: BingoSquare[] = [];
    for (let col = 0; col < 5; col++) {
      const isFreeSpace = row === 2 && col === 2;
      rowSquares.push({
        id: `${row}-${col}`,
        word: isFreeSpace ? FREE_SPACE_WORD : selectedWords[wordIndex++],
        isFilled: isFreeSpace, // free space starts filled
        isAutoFilled: false,
        isFreeSpace,
        filledAt: isFreeSpace ? now : null,
        row,
        col,
      });
    }
    squares.push(rowSquares);
  }

  return { squares, words: selectedWords };
}

/**
 * Build a Map of lowercased card word → square id, EXCLUDING the free space.
 * This is the lookup the auto-fill flow uses to map a detected word to a square.
 */
export function buildWordIndex(card: BingoCard): Map<string, string> {
  const index = new Map<string, string>();
  for (const row of card.squares) {
    for (const sq of row) {
      if (sq.isFreeSpace) continue;
      index.set(sq.word.toLowerCase(), sq.id);
    }
  }
  return index;
}
