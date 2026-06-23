// src/hooks/useSpeechRecognition.ts
// Web Speech API wrapper. Fixes the two documented gotchas:
//  1. Listening INTENT is tracked in `isListeningRef`, read synchronously in
//     `onend` to decide whether to restart — setState updaters stay pure and
//     never call recognition.start() (avoids the StrictMode double-start).
//  2. `onerror`/`onend` branch on the error: permission/abort errors stop for
//     good; transient errors (network/no-speech) restart with exponential
//     backoff so we never hot-loop.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpeechRecognitionState } from '../types';

/** Rolling cap on stored final transcript so it can't grow unbounded. */
const TRANSCRIPT_CAP = 2000;
const INITIAL_BACKOFF_MS = 250;
const MAX_BACKOFF_MS = 4000;

// Minimal structural types for the Web Speech API (not in lib.dom for all TS targets).
interface SpeechResultAlt {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechResultAlt;
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const RecognitionImpl = getRecognitionCtor();

// Permanent errors: do not auto-restart on these.
const NO_RESTART_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'aborted']);

export interface UseSpeechRecognition extends SpeechRecognitionState {
  startListening: (onResult?: (finalTranscript: string) => void) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognition {
  const [state, setState] = useState<SpeechRecognitionState>({
    isSupported: !!RecognitionImpl,
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
  });

  const recognitionRef = useRef<RecognitionLike | null>(null);
  const isListeningRef = useRef(false); // intent — the source of truth for restarts
  const onResultRef = useRef<((t: string) => void) | null>(null);
  const backoffRef = useRef(0);
  const restartTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!RecognitionImpl) return;

    const recognition = new RecognitionImpl();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }
      backoffRef.current = 0; // healthy stream → reset backoff
      setState((prev) => ({
        ...prev,
        transcript: final ? (prev.transcript + final).slice(-TRANSCRIPT_CAP) : prev.transcript,
        interimTranscript: interim,
      }));
      if (final && onResultRef.current) onResultRef.current(final);
    };

    recognition.onerror = (event) => {
      const error = event.error;
      if (NO_RESTART_ERRORS.has(error)) {
        isListeningRef.current = false; // stop intent so onend won't restart
        setState((prev) => ({ ...prev, isListening: false, error }));
      } else {
        // transient (network / no-speech / audio-capture): keep intent; onend restarts
        setState((prev) => ({ ...prev, error }));
      }
    };

    recognition.onend = () => {
      // PURE read of the intent ref — no recognition.start() inside a setState updater.
      if (!isListeningRef.current) {
        setState((prev) => (prev.isListening ? { ...prev, isListening: false } : prev));
        return;
      }
      const delay = backoffRef.current;
      backoffRef.current = Math.min((backoffRef.current || INITIAL_BACKOFF_MS) * 2, MAX_BACKOFF_MS);
      restartTimerRef.current = window.setTimeout(() => {
        if (!isListeningRef.current) return;
        try {
          recognition.start();
        } catch {
          // already started — safe to ignore
        }
      }, delay);
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // not started — ignore
      }
      recognitionRef.current = null;
    };
  }, []);

  const startListening = useCallback((onResult?: (t: string) => void) => {
    if (!recognitionRef.current) return;
    onResultRef.current = onResult ?? null;
    isListeningRef.current = true; // set intent synchronously BEFORE start
    backoffRef.current = 0;
    setState((prev) => ({ ...prev, isListening: true, error: null, interimTranscript: '' }));
    try {
      recognitionRef.current.start();
    } catch {
      // already running — ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false; // clear intent → onend won't restart
    if (restartTimerRef.current !== null) window.clearTimeout(restartTimerRef.current);
    onResultRef.current = null;
    setState((prev) => ({ ...prev, isListening: false }));
    try {
      recognitionRef.current?.stop();
    } catch {
      // not started — ignore
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setState((prev) => ({ ...prev, transcript: '', interimTranscript: '' }));
  }, []);

  return { ...state, startListening, stopListening, resetTranscript };
}
