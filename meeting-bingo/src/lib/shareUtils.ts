// src/lib/shareUtils.ts
// Build the shareable result summary (all 4 stats incl. category) and share it
// via the native share sheet, falling back to clipboard.

export interface ShareStats {
  categoryName: string;
  elapsedMs: number | null;
  filledCount: number;
  total: number;
  autoFillCount: number;
  manualFillCount: number;
  winningLineName: string | null;
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

function formatDuration(ms: number | null): string {
  if (ms === null) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function buildShareText(stats: ShareStats): string {
  return [
    '🎉 BINGO! I won Meeting Bingo.',
    `🃏 Pack: ${stats.categoryName}`,
    `⏱️ Time: ${formatDuration(stats.elapsedMs)}`,
    `✅ Squares: ${stats.filledCount}/${stats.total}`,
    `✨ Auto-filled ${stats.autoFillCount} · tapped ${stats.manualFillCount}`,
    stats.winningLineName ? `📐 ${stats.winningLineName}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Share via the native share sheet when available, else copy to clipboard.
 * Never throws — returns an outcome the UI can turn into a toast.
 */
export async function shareResult(text: string, url: string): Promise<ShareOutcome> {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  if (nav?.share) {
    try {
      await nav.share({ title: 'Meeting Bingo', text, url });
      return 'shared';
    } catch (err) {
      // User dismissed the sheet — not an error worth surfacing.
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Otherwise fall through to clipboard.
    }
  }

  if (nav?.clipboard?.writeText) {
    try {
      await nav.clipboard.writeText(`${text}\n${url}`);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
