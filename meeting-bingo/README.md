# Meeting Bingo

A zero-backend, zero-cost browser bingo game. A 5×5 card of corporate / agile / tech
buzzwords auto-fills as the **Web Speech API** transcribes a live meeting — with manual
tap as a fallback. Five in a row wins.

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS v3 + `canvas-confetti` +
Web Speech API + localStorage. No backend, no API keys.

## Commands

```bash
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve the production build
npm run typecheck  # tsc -b
npm run lint       # oxlint
npm run test       # vitest run (checkForBingo, detectWords, generateCard)
```

## How it works

1. **Pick a pack** (Agile, Corporate, Tech) — each previews sample words.
2. **Preview & start** — review the generated card, regenerate for a new one, then start.
3. **Listen or tap** — allow the mic (audio is processed locally, never recorded) to
   auto-fill squares as buzzwords are spoken, or tap squares manually.
4. **BINGO** — completing any row, column, or diagonal wins; share your result.

### Screen flow

`landing → select → setup → playing → won`

## Notes & constraints

- **Secure context required.** The Web Speech API only works over **HTTPS or
  `localhost`**. Testing on a LAN IP silently disables the mic.
- **Browser support.** Chrome is the primary target. Safari works via the
  `webkit`-prefixed API. Firefox has no Web Speech API → the app falls back to a
  fully playable **manual-only** mode.
- **Accessibility.** Fill state is conveyed without color (✓ / ✨ / ⭐ glyphs +
  `aria-pressed`), detected words and wins are announced via an `aria-live` region,
  and all animation (including confetti) is gated behind `prefers-reduced-motion`.
- Game progress is persisted to `localStorage`, so a refresh restores the card.

## Deploy (Vercel)

`vercel.json` is configured for a Vite static build. From this directory:

```bash
npx vercel        # preview deploy
npx vercel --prod # production deploy → public HTTPS URL (mic-enabled)
```

The public HTTPS URL is the shareable, mic-enabled deliverable — the local folder
alone is not. The final live-microphone test must be done in a real browser.
