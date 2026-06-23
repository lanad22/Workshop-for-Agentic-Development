// src/components/GameControls.tsx
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface SpeechControls {
  isSupported: boolean;
  isListening: boolean;
  onToggleListen: () => void;
}

interface Props {
  filledCount: number;
  total: number;
  isOneAway: boolean;
  speech: SpeechControls | null;
  onNewGame: () => void;
}

/** Progress counter, "One away!" hint, mic toggle, and new-game control. */
export function GameControls({ filledCount, total, isOneAway, speech, onNewGame }: Props) {
  const pct = Math.round((filledCount / total) * 100);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-primary">{filledCount}/{total} filled</span>
          {isOneAway && (
            <span className="rounded-full bg-square-free px-2 py-0.5 text-xs font-semibold text-text-primary">
              🔥 One away!
            </span>
          )}
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
          <div
            className="h-full rounded-full bg-accent-blue transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {speech?.isSupported ? (
          <Button
            variant={speech.isListening ? 'secondary' : 'primary'}
            onClick={speech.onToggleListen}
            aria-pressed={speech.isListening}
          >
            <span
              aria-hidden="true"
              className={cn('inline-block h-2 w-2 rounded-full', speech.isListening ? 'bg-red-500' : 'bg-gray-400')}
            />
            {speech.isListening ? 'Stop listening' : 'Start listening'}
          </Button>
        ) : (
          <span className="text-xs text-text-secondary">🎤 Manual mode — tap squares as you hear them</span>
        )}

        <Button variant="ghost" onClick={onNewGame}>
          New game
        </Button>
      </div>
    </div>
  );
}
