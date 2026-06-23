// src/components/LandingPage.tsx
import { Button } from './ui/Button';

interface Props {
  onStart: () => void;
}

const STEPS = [
  { icon: '🎯', title: 'Pick a pack', text: 'Choose Agile, Corporate, or Tech buzzwords.' },
  { icon: '🎤', title: 'Listen in', text: 'When you start a game you can let the mic auto-fill squares as buzzwords are said — or just tap them yourself.' },
  { icon: '🎉', title: 'Get BINGO', text: 'Five in a row wins. Share your victory.' },
];

export function LandingPage({ onStart }: Props) {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center gap-8 px-4 py-12 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl">
          Meeting Bingo
        </h1>
        <p className="text-lg text-text-secondary">
          Turn another endless meeting into a game. Buzzwords auto-fill your card as they’re spoken.
        </p>
      </div>

      <ul className="grid w-full gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.title} className="rounded-xl border border-gray-100 bg-white p-4 text-left shadow-sm">
            <div className="text-2xl" aria-hidden="true">{step.icon}</div>
            <h2 className="mt-2 text-sm font-semibold text-text-primary">{step.title}</h2>
            <p className="mt-1 text-xs text-text-secondary">{step.text}</p>
          </li>
        ))}
      </ul>

      <Button size="lg" onClick={onStart}>
        Play Meeting Bingo →
      </Button>
      <p className="text-xs text-text-secondary">
        No account, no recording. Audio is processed locally in your browser.
      </p>
    </main>
  );
}
