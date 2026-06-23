// src/components/CategorySelect.tsx
import { CATEGORIES } from '../data/categories';
import type { CategoryId } from '../types';
import { Button } from './ui/Button';

interface Props {
  onSelect: (id: CategoryId) => void;
  onBack: () => void;
}

/** Pick a buzzword pack. Each card previews 3 sample words (PRD US-1.2). */
export function CategorySelect({ onSelect, onBack }: Props) {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-text-primary">Choose your buzzwords</h1>
        <p className="mt-1 text-sm text-text-secondary">Pick a pack to generate a card.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((category) => {
          const samples = category.words.slice(0, 3);
          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                aria-label={`${category.name}: ${category.description}. Sample words: ${samples.join(', ')}`}
                className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-colors hover:border-accent-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:ring-offset-2"
              >
                <span className="text-3xl" aria-hidden="true">{category.icon}</span>
                <span className="mt-2 font-semibold text-text-primary">{category.name}</span>
                <span className="mt-1 text-xs text-text-secondary">{category.description}</span>
                <span className="mt-3 flex flex-wrap gap-1" aria-hidden="true">
                  {samples.map((word) => (
                    <span key={word} className="rounded-full bg-square-hover px-2 py-0.5 text-[0.65rem] text-text-secondary">
                      {word}
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="text-center">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>
    </main>
  );
}
