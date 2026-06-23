// src/hooks/useGame.ts
// The SINGLE game-state source (App-level useState lives here). No GameContext,
// no useBingoDetection — this hook owns status transitions, the card, manual
// toggles, and the speech auto-fill glue (Phase 3). Components stay presentational.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { BingoCard, CategoryId, GameStatus, WinningLine } from '../types';
import { buildWordIndex, generateCard } from '../lib/cardGenerator';
import { checkForBingo, countFilled, getClosestToWin, TOTAL_FILLABLE } from '../lib/bingoChecker';
import { buildCardAliases, detectWordsWithAliases } from '../lib/wordDetector';
import { useLocalStorage } from './useLocalStorage';

const STORAGE_KEY = 'meeting-bingo-game';

interface GameCore {
  status: GameStatus;
  category: CategoryId | null;
  card: BingoCard | null;
  startedAt: number | null;
  completedAt: number | null;
  winningLine: WinningLine | null;
  winningWord: string | null;
  autoFillCount: number;
  manualFillCount: number;
}

const INITIAL: GameCore = {
  status: 'landing',
  category: null,
  card: null,
  startedAt: null,
  completedAt: null,
  winningLine: null,
  winningWord: null,
  autoFillCount: 0,
  manualFillCount: 0,
};

/** Lowercased words of the currently-filled, non-free squares. */
function filledWordSet(card: BingoCard): Set<string> {
  const set = new Set<string>();
  for (const row of card.squares) {
    for (const sq of row) {
      if (sq.isFilled && !sq.isFreeSpace) set.add(sq.word.toLowerCase());
    }
  }
  return set;
}

/** Run the win check on a freshly-updated state and transition to `won` if a line completed. */
function finalizeWin(state: GameCore, now: number, triggerWord: string | null): GameCore {
  if (!state.card || state.status === 'won') return state;
  const line = checkForBingo(state.card);
  if (!line) return state;
  return {
    ...state,
    status: 'won',
    winningLine: line,
    winningWord: triggerWord,
    completedAt: now,
  };
}

export function useGame() {
  // Persisted across reloads so a refresh mid-game restores the card + progress.
  const [game, setGame] = useLocalStorage<GameCore>(STORAGE_KEY, INITIAL);

  // Auto-fill lookups, kept in sync with the current card (see effect below).
  const wordIndexRef = useRef<Map<string, string>>(new Map());
  const aliasMapRef = useRef<Record<string, string[]>>({});

  // Mirror of latest committed state for synchronous reads inside callbacks.
  const gameRef = useRef(game);
  gameRef.current = game;

  // Rebuild the word→square index and per-card aliases whenever the card
  // changes — covers both fresh generation AND rehydration from localStorage.
  useEffect(() => {
    if (game.card) {
      wordIndexRef.current = buildWordIndex(game.card);
      aliasMapRef.current = buildCardAliases(game.card.words);
    }
  }, [game.card]);

  const goToSelect = useCallback(() => setGame({ ...INITIAL, status: 'select' }), [setGame]);

  const selectCategory = useCallback(
    (categoryId: CategoryId) => {
      setGame({ ...INITIAL, status: 'setup', category: categoryId, card: generateCard(categoryId) });
    },
    [setGame],
  );

  const regenerateCard = useCallback(() => {
    const { category } = gameRef.current;
    if (!category) return;
    const card = generateCard(category);
    setGame((prev) => ({ ...prev, card }));
  }, [setGame]);

  const startGame = useCallback(() => {
    const now = Date.now();
    setGame((prev) => (prev.status === 'setup' ? { ...prev, status: 'playing', startedAt: now } : prev));
  }, [setGame]);

  /** Manual tap: toggle a square's fill, then re-check for a win on fill. */
  const toggleSquare = useCallback((squareId: string) => {
    const now = Date.now();
    setGame((prev) => {
      if (!prev.card || prev.status !== 'playing') return prev;
      let delta = 0;
      let toggledWord: string | null = null;
      const squares = prev.card.squares.map((row) =>
        row.map((sq) => {
          if (sq.id !== squareId || sq.isFreeSpace) return sq;
          toggledWord = sq.word;
          if (sq.isFilled) {
            delta = -1;
            return { ...sq, isFilled: false, isAutoFilled: false, filledAt: null };
          }
          delta = 1;
          return { ...sq, isFilled: true, isAutoFilled: false, filledAt: now };
        }),
      );
      if (delta === 0) return prev;
      const next: GameCore = {
        ...prev,
        card: { ...prev.card, squares },
        manualFillCount: prev.manualFillCount + (delta === 1 ? 1 : 0),
      };
      return delta === 1 ? finalizeWin(next, now, toggledWord) : next;
    });
  }, [setGame]);

  /**
   * Speech auto-fill (Phase 3). Detection runs against the latest committed
   * card; the immutable fill is applied to `prev` and re-guards on `isFilled`,
   * so a word can never fill twice or double-count even under rapid results.
   * Returns the detected words so the caller can surface toasts / transcript chips.
   */
  const processTranscript = useCallback((text: string): string[] => {
    const current = gameRef.current;
    if (!current.card || current.status !== 'playing') return [];

    const detected = detectWordsWithAliases(
      text,
      current.card.words,
      filledWordSet(current.card),
      aliasMapRef.current,
    );
    if (detected.length === 0) return [];

    const now = Date.now();
    const fillSet = new Set(detected.map((w) => w.toLowerCase()));

    setGame((prev) => {
      if (!prev.card || prev.status !== 'playing') return prev;
      let newlyFilled = 0;
      const squares = prev.card.squares.map((row) =>
        row.map((sq) => {
          if (!sq.isFilled && !sq.isFreeSpace && fillSet.has(sq.word.toLowerCase())) {
            newlyFilled += 1;
            return { ...sq, isFilled: true, isAutoFilled: true, filledAt: now };
          }
          return sq;
        }),
      );
      if (newlyFilled === 0) return prev;
      const next: GameCore = {
        ...prev,
        card: { ...prev.card, squares },
        autoFillCount: prev.autoFillCount + newlyFilled,
      };
      return finalizeWin(next, now, detected[detected.length - 1]);
    });

    return detected;
  }, [setGame]);

  const resetGame = useCallback(() => setGame(INITIAL), [setGame]);
  const playAgain = useCallback(() => setGame({ ...INITIAL, status: 'select' }), [setGame]);

  // Derived, never stored — can't drift from the card.
  const card = game.card;
  const filledCount = useMemo(() => (card ? countFilled(card) : 0), [card]);
  const closest = useMemo(() => (card ? getClosestToWin(card) : null), [card]);
  const isOneAway = closest?.needed === 1;
  const elapsedMs =
    game.completedAt !== null && game.startedAt !== null ? game.completedAt - game.startedAt : null;

  return {
    // state
    status: game.status,
    category: game.category,
    card,
    startedAt: game.startedAt,
    completedAt: game.completedAt,
    winningLine: game.winningLine,
    winningWord: game.winningWord,
    autoFillCount: game.autoFillCount,
    manualFillCount: game.manualFillCount,
    // derived
    filledCount,
    total: TOTAL_FILLABLE,
    closest,
    isOneAway,
    elapsedMs,
    // actions
    goToSelect,
    selectCategory,
    regenerateCard,
    startGame,
    toggleSquare,
    processTranscript,
    resetGame,
    playAgain,
  };
}

export type UseGame = ReturnType<typeof useGame>;
