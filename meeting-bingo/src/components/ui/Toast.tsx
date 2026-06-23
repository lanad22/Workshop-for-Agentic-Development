// src/components/ui/Toast.tsx
import { useEffect } from 'react';
import type { Toast as ToastData } from '../../types';
import { cn } from '../../lib/utils';

const TYPE_STYLES: Record<ToastData['type'], string> = {
  success: 'bg-square-filled text-square-filled-text border-accent-blue/30',
  info: 'bg-white text-text-primary border-gray-200',
  warning: 'bg-square-free text-text-primary border-accent-yellow/40',
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 2500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      className={cn(
        'pointer-events-auto rounded-lg border px-4 py-2 text-sm font-medium shadow-md',
        TYPE_STYLES[toast.type],
      )}
    >
      {toast.message}
    </div>
  );
}

/**
 * Fixed top-center stack of toasts. The live-region announcing of detected
 * words is handled separately (App's aria-live region), so this is aria-hidden
 * to avoid double announcements.
 */
export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
