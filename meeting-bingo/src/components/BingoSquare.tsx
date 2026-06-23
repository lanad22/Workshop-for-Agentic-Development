// src/components/BingoSquare.tsx
import type { BingoSquare as BingoSquareType } from '../types';
import { cn } from '../lib/utils';

interface Props {
  square: BingoSquareType;
  isWinning: boolean;
  isHint: boolean;
  interactive: boolean;
  reducedMotion: boolean;
  onToggle: (id: string) => void;
}

/**
 * One bingo cell. Fill state is conveyed WITHOUT relying on color: a ✓ glyph
 * for manual fills, ✨ for speech auto-fills, ⭐ for the free space — so the
 * board is usable by colorblind users and screen readers (aria-pressed + label).
 */
export function BingoSquare({ square, isWinning, isHint, interactive, reducedMotion, onToggle }: Props) {
  const { word, isFilled, isAutoFilled, isFreeSpace } = square;
  const disabled = isFreeSpace || !interactive;

  const stateLabel = isFreeSpace
    ? 'free space'
    : isFilled
      ? isAutoFilled
        ? 'filled automatically'
        : 'filled'
      : 'not filled';

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(square.id)}
      disabled={disabled}
      aria-pressed={isFreeSpace ? undefined : isFilled}
      aria-label={`${isFreeSpace ? 'Free space' : word}, ${stateLabel}`}
      className={cn(
        'relative flex aspect-square items-center justify-center rounded-lg border-2 p-1 text-center',
        'text-[0.62rem] font-medium leading-tight sm:text-xs',
        !reducedMotion && 'transition-transform duration-150',
        interactive && !isFreeSpace && !reducedMotion && 'hover:scale-105 active:scale-95',
        // unfilled
        !isFilled && 'border-gray-200 bg-square-default text-text-primary hover:border-accent-blue/40',
        // manual fill: light-blue bg + dark text (PRD token), solid accent border
        isFilled && !isFreeSpace && !isAutoFilled && 'border-accent-blue bg-square-filled text-square-filled-text',
        // auto fill: same fill + ring to persistently distinguish from manual
        isFilled && !isFreeSpace && isAutoFilled &&
          'border-accent-blue bg-square-filled text-square-filled-text ring-2 ring-accent-blue ring-offset-1',
        // free space
        isFreeSpace && 'cursor-default border-accent-yellow/50 bg-square-free text-text-primary',
        // hint: line one square from winning
        isHint && !isFilled && 'border-accent-yellow ring-2 ring-accent-yellow/50',
        // winning line
        isWinning && 'border-accent-green bg-square-win text-text-primary ring-2 ring-accent-green',
      )}
    >
      {/* Non-color fill indicator */}
      {isFilled && !isFreeSpace && (
        <span aria-hidden="true" className="absolute right-0.5 top-0.5 text-[0.6rem]">
          {isAutoFilled ? '✨' : '✓'}
        </span>
      )}
      <span className={cn('break-words', isFilled && !isFreeSpace && 'line-through opacity-90')}>
        {isFreeSpace ? '⭐ FREE' : word}
      </span>
    </button>
  );
}
