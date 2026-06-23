// src/components/SetupScreen.tsx
// The required card-preview/regenerate step (PRD US-1.3). Reaching `playing`
// always passes through here — never straight from category select.

import type { BingoCard as BingoCardType } from '../types';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';

interface Props {
  card: BingoCardType;
  categoryName: string;
  reducedMotion: boolean;
  onRegenerate: () => void;
  onStart: () => void;
  onBack: () => void;
}

export function SetupScreen({ card, categoryName, reducedMotion, onRegenerate, onStart, onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Your card</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {categoryName} · preview before you start
        </p>
      </header>

      {/* Preview only — squares aren't tappable until the game starts. */}
      <BingoCard card={card} interactive={false} reducedMotion={reducedMotion} onToggle={() => {}} />

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={onStart}>
          Start game
        </Button>
        <Button variant="secondary" onClick={onRegenerate}>
          🎲 New card
        </Button>
        <Button variant="ghost" onClick={onBack}>
          ← Change pack
        </Button>
      </div>
    </main>
  );
}
