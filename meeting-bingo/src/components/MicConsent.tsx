// src/components/MicConsent.tsx
// Pre-listen consent / privacy-trust step (PRD US-2.1). Shown BEFORE the mic is
// ever activated. Also renders the graceful denied-permission state.

import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  denied: boolean;
  onAllow: () => void;
  onManual: () => void;
}

export function MicConsent({ denied, onAllow, onManual }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-consent-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
    >
      <Card className="w-full max-w-sm text-center">
        <p className="text-4xl" aria-hidden="true">🎤</p>
        <h2 id="mic-consent-title" className="mt-2 text-xl font-bold text-text-primary">
          {denied ? 'Microphone blocked' : 'Use your microphone?'}
        </h2>

        {denied ? (
          <p className="mt-2 text-sm text-text-secondary">
            We couldn’t access the mic — permission was denied. You can still play by tapping
            squares yourself. To enable auto-fill, allow microphone access in your browser and try again.
          </p>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">
            Squares fill automatically as buzzwords are spoken. <strong>Audio is processed locally
            in your browser and is never recorded or uploaded.</strong>
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <Button size="lg" onClick={onAllow}>
            {denied ? 'Try again' : 'Allow microphone'}
          </Button>
          <Button variant="secondary" onClick={onManual}>
            Play without mic (tap squares)
          </Button>
        </div>

        <p className="mt-3 text-[0.7rem] text-text-secondary">
          The mic needs a secure connection (HTTPS or localhost).
        </p>
      </Card>
    </div>
  );
}
