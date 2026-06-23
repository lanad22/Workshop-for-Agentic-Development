// src/lib/utils.ts
// Minimal, dependency-free class-name joiner (clsx-style). The architecture
// doc's components import `cn` from here but it was never defined (plan §2 #1).
// Avoids pulling in clsx/tailwind-merge for a 90-minute MVP.

export type ClassValue =
  | string
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>
  | ClassValue[];

/**
 * Join class names, dropping falsy values. Supports strings, arrays, and
 * `{ 'class-name': condition }` objects.
 *
 *   cn('a', false && 'b', ['c', cond && 'd'], { e: true, f: false }) // "a c d e"
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) classes.push(nested);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(' ');
}
