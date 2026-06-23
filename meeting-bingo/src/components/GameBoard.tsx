// src/components/GameBoard.tsx
// The `playing` screen container: card + progress/controls + (when speech is
// active) the live transcript. Presentational — state comes from useGame.

import type { BingoCard as BingoCardType } from '../types';
import type { ClosestLine } from '../lib/bingoChecker';
import { BingoCard } from './BingoCard';
import { GameControls } from './GameControls';
import { TranscriptPanel } from './TranscriptPanel';

export interface SpeechView {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  detectedWords: string[];
  onToggleListen: () => void;
}

interface Props {
  card: BingoCardType;
  filledCount: number;
  total: number;
  isOneAway: boolean;
  closest: ClosestLine | null;
  reducedMotion: boolean;
  speech: SpeechView | null;
  onToggleSquare: (id: string) => void;
  onNewGame: () => void;
}

export function GameBoard({
  card,
  filledCount,
  total,
  isOneAway,
  closest,
  reducedMotion,
  speech,
  onToggleSquare,
  onNewGame,
}: Props) {
  // Highlight the unfilled squares of the closest line only when one away.
  const hintIds = isOneAway && closest ? new Set(closest.squares) : undefined;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-6">
      <GameControls
        filledCount={filledCount}
        total={total}
        isOneAway={isOneAway}
        speech={speech ? { isSupported: speech.isSupported, isListening: speech.isListening, onToggleListen: speech.onToggleListen } : null}
        onNewGame={onNewGame}
      />

      <BingoCard
        card={card}
        hintIds={hintIds}
        interactive
        reducedMotion={reducedMotion}
        onToggle={onToggleSquare}
      />

      {speech?.isSupported && (
        <TranscriptPanel
          transcript={speech.transcript}
          interimTranscript={speech.interimTranscript}
          detectedWords={speech.detectedWords}
          isListening={speech.isListening}
        />
      )}
    </main>
  );
}
