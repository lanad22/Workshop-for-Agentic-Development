// src/components/WinScreen.tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { BingoCard as BingoCardType } from '../types';
import { BingoCard } from './BingoCard';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  card: BingoCardType;
  winningIds: Set<string>;
  categoryName: string;
  elapsedMs: number | null;
  filledCount: number;
  total: number;
  autoFillCount: number;
  manualFillCount: number;
  winningLineName: string | null;
  reducedMotion: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
  onShare: () => void;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function WinScreen({
  card,
  winningIds,
  categoryName,
  elapsedMs,
  filledCount,
  total,
  autoFillCount,
  manualFillCount,
  winningLineName,
  reducedMotion,
  onPlayAgain,
  onHome,
  onShare,
}: Props) {
  // Discreet, silent celebration — suppressed entirely under reduced motion.
  useEffect(() => {
    if (reducedMotion) return;
    void confetti({
      particleCount: 120,
      spread: 75,
      startVelocity: 35,
      origin: { y: 0.35 },
      disableForReducedMotion: true,
    });
  }, [reducedMotion]);

  const stats = [
    { label: 'Category', value: categoryName },
    { label: 'Time to BINGO', value: formatDuration(elapsedMs) },
    { label: 'Squares marked', value: `${filledCount}/${total}` },
    { label: 'Auto-filled · tapped', value: `${autoFillCount} · ${manualFillCount}` },
  ];

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col items-center gap-5 px-4 py-8 text-center">
      <div>
        <p className="text-5xl" aria-hidden="true">🎉</p>
        <h1 className="mt-2 text-3xl font-extrabold text-text-primary">BINGO!</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {winningLineName ? `${winningLineName} completed` : 'You won'}
        </p>
      </div>

      <div className="w-full">
        <BingoCard
          card={card}
          winningIds={winningIds}
          interactive={false}
          reducedMotion={reducedMotion}
          onToggle={() => {}}
        />
      </div>

      <Card className="w-full">
        <dl className="grid grid-cols-2 gap-4 text-left">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs uppercase tracking-wide text-text-secondary">{stat.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-text-primary">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <div className="flex w-full flex-col gap-2">
        <Button size="lg" onClick={onShare}>
          📋 Share result
        </Button>
        <Button variant="secondary" onClick={onPlayAgain}>
          Play again
        </Button>
        <Button variant="ghost" onClick={onHome}>
          Home
        </Button>
      </div>
    </main>
  );
}
