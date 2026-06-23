// src/hooks/useLocalStorage.ts
// Generic localStorage-backed state. JSON-safe values only — timestamps are
// epoch-millis numbers (never Date), so they round-trip cleanly. Corrupt or
// absent storage falls back to the initial value.

import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full / unavailable (private mode) — non-fatal
    }
  }, [key, value]);

  return [value, setValue] as const;
}
