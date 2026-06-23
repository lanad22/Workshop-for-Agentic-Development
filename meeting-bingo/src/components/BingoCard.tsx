// src/components/BingoCard.tsx
import type { BingoCard as BingoCardType } from '../types';
import { BingoSquare } from './BingoSquare';

interface Props {
  card: BingoCardType;
  winningIds?: Set<string>;
  hintIds?: Set<string>;
  interactive: boolean;
  reducedMotion: boolean;
  onToggle: (id: string) => void;
}

/** The 5×5 grid. Presentational — all fill logic lives in useGame. */
export function BingoCard({ card, winningIds, hintIds, interactive, reducedMotion, onToggle }: Props) {
  return (
    <div
      role="grid"
      aria-label="Bingo card"
      className="grid grid-cols-5 gap-1.5 sm:gap-2"
    >
      {card.squares.flat().map((square) => (
        <BingoSquare
          key={square.id}
          square={square}
          isWinning={winningIds?.has(square.id) ?? false}
          isHint={hintIds?.has(square.id) ?? false}
          interactive={interactive}
          reducedMotion={reducedMotion}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}
