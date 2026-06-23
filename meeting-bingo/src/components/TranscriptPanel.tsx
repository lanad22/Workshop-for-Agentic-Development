// src/components/TranscriptPanel.tsx
import { cn } from '../lib/utils';

interface Props {
  transcript: string;
  interimTranscript: string;
  detectedWords: string[];
  isListening: boolean;
}

/**
 * Live transcript + recently-detected word chips. Only the tail of the
 * transcript is shown; the full rolling buffer is capped upstream in the hook.
 */
export function TranscriptPanel({ transcript, interimTranscript, detectedWords, isListening }: Props) {
  const tail = transcript.slice(-120);

  return (
    <div className="rounded-lg bg-bg-secondary p-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn('h-2.5 w-2.5 rounded-full', isListening ? 'bg-red-500' : 'bg-gray-400')}
        />
        <span className="text-xs font-medium text-text-secondary">
          {isListening ? 'Listening…' : 'Paused'}
        </span>
      </div>

      <p className="min-h-[2.5rem] text-sm text-text-primary">
        {tail || <span className="text-text-secondary">Waiting for speech…</span>}
        {interimTranscript && <span className="text-text-secondary italic"> {interimTranscript}</span>}
      </p>

      {detectedWords.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-gray-200 pt-2">
          <span className="text-xs text-text-secondary">Detected:</span>
          {detectedWords.slice(-6).map((word, i) => (
            <span
              key={`${word}-${i}`}
              className="rounded-full bg-square-filled px-2 py-0.5 text-xs text-square-filled-text"
            >
              ✨ {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
