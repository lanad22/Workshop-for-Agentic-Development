// src/hooks/useToasts.ts
// Tiny toast queue: one toast per detected word (Phase 3). Keeps at most a few
// on screen so a burst of detections doesn't pile up.

import { useCallback, useRef, useState } from 'react';
import type { Toast, ToastType } from '../types';

const MAX_VISIBLE = 3;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
    const id = `toast-${counter.current++}`;
    setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
