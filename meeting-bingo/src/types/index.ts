// src/types/index.ts
// Shared type definitions for Meeting Bingo.
// Adapted from the architecture doc, reconciled with implementation-plan.md:
//  - GameStatus uses the full five-screen flow (landing → select → setup → playing → won).
//  - All timestamps are epoch-millis `number` (never `Date`) so they serialize
//    cleanly to localStorage (plan §2 #5).

// =============================================
// CATEGORY & WORDS
// =============================================
export type CategoryId = 'agile' | 'corporate' | 'tech';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  icon: string;
  words: string[];
}

// =============================================
// BINGO CARD
// =============================================
export interface BingoSquare {
  id: string; // Unique grid ID: "row-col", e.g. "2-3"
  word: string;
  isFilled: boolean;
  isAutoFilled: boolean; // true when filled by speech recognition, false when tapped manually
  isFreeSpace: boolean;
  filledAt: number | null; // epoch millis, null when unfilled
  row: number;
  col: number;
}

export interface BingoCard {
  squares: BingoSquare[][]; // 5x5 grid
  words: string[]; // flat list of the 24 non-free words, for detection
}

// =============================================
// GAME STATE
// =============================================
// Full screen flow per implementation-plan.md (the architecture doc's
// 'idle' is replaced by explicit 'landing' + 'select' + the required 'setup' step).
export type GameStatus = 'landing' | 'select' | 'setup' | 'playing' | 'won';

export interface WinningLine {
  type: 'row' | 'column' | 'diagonal';
  index: number; // 0-4 for row/col, 0-1 for diagonal
  squares: string[]; // IDs of the winning squares
}

export interface GameState {
  status: GameStatus;
  category: CategoryId | null;
  card: BingoCard | null;
  startedAt: number | null; // epoch millis
  completedAt: number | null; // epoch millis
  winningLine: WinningLine | null;
  winningWord: string | null;
  // Note: listening state lives on SpeechRecognitionState (the hook owns it) —
  // not mirrored here, to keep a single source of truth (CLAUDE.md).
  // The filled count is derived from card.squares (count of isFilled && !isFreeSpace),
  // never stored, so it can't drift from the card.
}

// =============================================
// SPEECH RECOGNITION
// =============================================
export interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

// =============================================
// UI STATE
// =============================================
export type ToastType = 'success' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}
