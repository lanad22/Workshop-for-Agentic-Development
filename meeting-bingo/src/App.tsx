import { useCallback, useEffect, useState } from 'react';
import { useGame } from './hooks/useGame';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useToasts } from './hooks/useToasts';
import { describeLine } from './lib/bingoChecker';
import { buildShareText, shareResult } from './lib/shareUtils';
import { CATEGORIES } from './data/categories';
import type { CategoryId } from './types';
import { LandingPage } from './components/LandingPage';
import { CategorySelect } from './components/CategorySelect';
import { SetupScreen } from './components/SetupScreen';
import { GameBoard, type SpeechView } from './components/GameBoard';
import { WinScreen } from './components/WinScreen';
import { MicConsent } from './components/MicConsent';
import { ToastViewport } from './components/ui/Toast';

type MicChoice = 'pending' | 'granted' | 'manual';

function categoryName(id: CategoryId | null): string {
  return CATEGORIES.find((c) => c.id === id)?.name ?? '';
}

export default function App() {
  const game = useGame();
  const speech = useSpeechRecognition();
  const reducedMotion = useReducedMotion();
  const { toasts, addToast, removeToast } = useToasts();

  const [micChoice, setMicChoice] = useState<MicChoice>('pending');
  const [detectedWords, setDetectedWords] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const { processTranscript } = game;
  const { isListening, startListening, stopListening, resetTranscript } = speech;

  const permissionDenied = speech.error === 'not-allowed' || speech.error === 'service-not-allowed';

  // Speech result → fill squares → surface toasts + announce for screen readers.
  const handleResult = useCallback(
    (final: string) => {
      const detected = processTranscript(final);
      if (detected.length === 0) return;
      setDetectedWords((prev) => [...prev, ...detected].slice(-12));
      detected.forEach((word) => addToast(`✨ ${word}`));
      setAnnouncement(`Detected ${detected.join(', ')}`);
    },
    [processTranscript, addToast],
  );

  const handleAllowMic = useCallback(() => {
    setMicChoice('granted');
    startListening(handleResult);
  }, [startListening, handleResult]);

  const handleManualMode = useCallback(() => {
    setMicChoice('manual');
    stopListening();
  }, [stopListening]);

  const handleToggleListen = useCallback(() => {
    if (isListening) {
      stopListening();
    } else if (micChoice === 'granted') {
      startListening(handleResult);
    } else {
      setMicChoice('pending'); // re-open the consent dialog
    }
  }, [isListening, micChoice, startListening, stopListening, handleResult]);

  // Stop the mic whenever we leave the playing screen (win, new game, home).
  useEffect(() => {
    if (game.status !== 'playing' && isListening) stopListening();
  }, [game.status, isListening, stopListening]);

  // Reset per-game speech UI state when returning to the start of the flow.
  useEffect(() => {
    if (game.status === 'landing' || game.status === 'select') {
      setMicChoice('pending');
      setDetectedWords([]);
      resetTranscript();
    }
  }, [game.status, resetTranscript]);

  // Announce the win for assistive tech.
  useEffect(() => {
    if (game.status === 'won') {
      setAnnouncement(`BINGO! ${describeLine(game.winningLine) ?? 'You won.'}`);
    }
  }, [game.status, game.winningLine]);

  const handleShare = useCallback(async () => {
    const text = buildShareText({
      categoryName: categoryName(game.category),
      elapsedMs: game.elapsedMs,
      filledCount: game.filledCount,
      total: game.total,
      autoFillCount: game.autoFillCount,
      manualFillCount: game.manualFillCount,
      winningLineName: describeLine(game.winningLine),
    });
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const outcome = await shareResult(text, url);
    if (outcome === 'copied') addToast('Result copied to clipboard', 'info');
    else if (outcome === 'failed') addToast('Could not share result', 'warning');
  }, [game, addToast]);

  const speechView: SpeechView | null = speech.isSupported
    ? {
        isSupported: true,
        isListening,
        transcript: speech.transcript,
        interimTranscript: speech.interimTranscript,
        detectedWords,
        onToggleListen: handleToggleListen,
      }
    : null;

  const showConsent =
    speech.isSupported &&
    game.status === 'playing' &&
    micChoice !== 'manual' &&
    (micChoice === 'pending' || permissionDenied);

  function renderScreen() {
    switch (game.status) {
      case 'landing':
        return <LandingPage onStart={game.goToSelect} />;
      case 'select':
        return <CategorySelect onSelect={game.selectCategory} onBack={game.resetGame} />;
      case 'setup':
        return game.card ? (
          <SetupScreen
            card={game.card}
            categoryName={categoryName(game.category)}
            reducedMotion={reducedMotion}
            onRegenerate={game.regenerateCard}
            onStart={game.startGame}
            onBack={game.goToSelect}
          />
        ) : null;
      case 'playing':
        return game.card ? (
          <GameBoard
            card={game.card}
            filledCount={game.filledCount}
            total={game.total}
            isOneAway={game.isOneAway}
            closest={game.closest}
            reducedMotion={reducedMotion}
            speech={speechView}
            onToggleSquare={game.toggleSquare}
            onNewGame={game.playAgain}
          />
        ) : null;
      case 'won':
        return game.card ? (
          <WinScreen
            card={game.card}
            winningIds={new Set(game.winningLine?.squares ?? [])}
            categoryName={categoryName(game.category)}
            elapsedMs={game.elapsedMs}
            filledCount={game.filledCount}
            total={game.total}
            autoFillCount={game.autoFillCount}
            manualFillCount={game.manualFillCount}
            winningLineName={describeLine(game.winningLine)}
            reducedMotion={reducedMotion}
            onPlayAgain={game.playAgain}
            onHome={game.resetGame}
            onShare={handleShare}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
      {renderScreen()}
      {showConsent && (
        <MicConsent denied={permissionDenied} onAllow={handleAllowMic} onManual={handleManualMode} />
      )}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </>
  );
}
