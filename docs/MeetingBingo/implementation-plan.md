# Meeting Bingo — Implementation Plan

**Version**: 1.1
**Date**: 2026-06-23
**Source specs**: `meeting-bingo-prd.md`, `meeting-bingo-architecture.md`, `meeting-bingo-uxr.md`
**Target**: Functional MVP (browser-based bingo with live audio buzzword detection)

---

## Review Summary

**Reviewed:** 2026-06-23
**Reviewers:** VP Product, VP Engineering, VP Design
**Outcome:** 25 issues identified (3 Critical, 9 High, 9 Medium, 4 Low). All recommendations approved. See Changes Applied and Unresolved Items below.

### Changes Applied

| Rank | Change |
|------|--------|
| 1 | Speech hook: track listening intent in `isListeningRef` read synchronously in `onend`; keep `setState` pure (fixes StrictMode double-`start()`). |
| 2 | Add a `status:'setup'` card-preview screen with "New Card" regenerate + explicit Start before `playing` (restores PRD US-1.3). |
| 3 | Add an explicit pre-listen mic-consent step with "processed locally, never recorded" copy + denied-permission UI (PRD US-2.1). |
| 4 | In `onend`/`onerror`, branch on `event.error`; do not auto-restart on `not-allowed`/`service-not-allowed`/`aborted`; add backoff. |
| 5 | Add a "Phase 3 — auto-fill data flow" spec: detection location, word→squareId index (lowercased, built at card-gen), immutable card update, where `checkForBingo` runs. |
| 6 | Pick ONE state approach: App-level `useState` + `useGame`; remove `context/GameContext.tsx` and reconcile/remove `useBingoDetection.ts`. |
| 7 | De-dupe `WORD_ALIASES` against actual card words (CI/CD vs "continuous integration"); build `alreadyFilled` Set with the same `.toLowerCase()` normalization as `detectWords`. |
| 8 | Wire `getClosestToWin()` to a "X/24 filled" counter + "One away!" indicator + potential-winning-line highlight (PRD US-3.2). |
| 9 | Add explicit Vercel deploy step to Phase 4 (the viral shareable URL). |
| 10 | Accessibility: non-color filled indicator (check glyph / `aria-pressed`), `aria-live=polite` for detected words + bingo, gate animations behind `prefers-reduced-motion`, make free-space perceivable. |
| 11 | Map PRD color tokens to a Tailwind theme extension; reconcile filled-square styling (`#dbeafe` + dark text); verify WCAG AA contrast. |
| 12 | Wire Toast per detected word; commit <500ms fill + persistent auto-vs-manual visual distinction; confetti discreet + sound off by default. |
| 13 | Add Vitest unit tests: `checkForBingo` (12 lines + free space), `detectWords` (boundary/phrase/alias double-fill), `generateCard` uniqueness. |
| 14 | Cap stored `transcript` to a rolling buffer; standardize timestamps on epoch-millis in `useLocalStorage`. |
| 15 | Add per-phase minute budgets + a P2-first drop order; document HTTPS/secure-context requirement; add Safari (webkit) + Firefox fallback to verification. |
| 16 | CategorySelect: render 2–3 sample words per pack (US-1.2); WinScreen: enumerate all 4 stats incl. category played (US-4.2). |

### Unresolved Items

- [ ] P2 light/dark theme — explicitly deferred post-MVP (confirm decision, not oversight)
- [ ] Mobile/peripheral (PiP / second-monitor / phone) layout — needs an acceptance criterion, not just a Phase-4 "tweak"
- [ ] PRD success-metric validation (>70% detection accuracy, <2s card gen) — no automated check planned
- [ ] Reconcile landing "Enable microphone" step-2 copy with the actual built flow

---

## 1. Overview

These specs are unusually complete. The architecture doc already contains **working reference code** for the hard parts — card generation (Fisher-Yates), the BINGO checker (all 12 lines), word detection (regex word-boundaries + phrase matching + aliases), and the full `useSpeechRecognition` hook. So this is less "design from scratch" and more **assemble + wire + style**.

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS, `canvas-confetti`, Web Speech API, localStorage. Zero backend, zero cost.

---

## 2. Decisions & gaps to reconcile

The docs have a few internal inconsistencies. These are resolved as follows during the build:

| # | Issue | Resolution |
|---|-------|------------|
| 1 | `cn` utility is referenced in `BingoSquare`/`TranscriptPanel` but never defined | Add `src/lib/utils.ts` with a minimal `cn` (dependency-free `clsx`-style join), avoiding extra deps |
| 2 | `App.tsx` jumps straight to `status: 'playing'` on category select, but the PRD describes a card-preview/regenerate step first | **Restore the preview step** — add a `status: 'setup'` screen (enum already exists) showing the generated card with a "New Card" regenerate button and an explicit **Start** action before `playing` (satisfies P0 US-1.3). Do not silently cut this. |
| 3 | Auto-fill → win wiring is unspecified — the hook delivers transcripts, but nothing connects detection → square fill → `checkForBingo` → `onWin` | Specify the full data flow (see Phase 3 below): build a `word → squareId` index (lowercased, at card-gen, excluding FREE space); on each detected word, immutably set `isFilled`/`isAutoFilled`, then run `checkForBingo`, then `onWin`. Owns this glue in `useGame`. |
| 4 | Tailwind v3 vs v4 ambiguity | Use **v3** exactly as the doc's `package.json` and `tailwind.config.js` specify (v3-style config + `postcss` + `autoprefixer`) |
| 5 | `generateCard` uses `Date.now()` for the free-space timestamp | Fine at runtime; ensure localStorage serialization stores **epoch-millis numbers**, never `Date` instances (per types) |
| 6 | Three overlapping state approaches listed (`useGame.ts` + `context/GameContext.tsx` + App-level `useState`) | Pick ONE: App-level `useState` + a `useGame` hook. Remove `context/GameContext.tsx`; reconcile/remove `useBingoDetection.ts` (overlaps `bingoChecker.ts` + `useGame`). |
| 7 | Mic permission/privacy-trust step has no dedicated UI (PRD US-2.1, UXR trust moment) | Add an explicit pre-listen consent step: "Audio is processed locally and never recorded" copy **before** listening starts, plus graceful denied-permission UI. |
| 8 | Hardcoded Tailwind colors mismatch PRD design tokens | Map PRD tokens (`--filled-square #dbeafe`, etc.) into the Tailwind theme; filled square uses light-blue bg + dark text (not solid blue-500 + white). Verify WCAG AA contrast. |

---

## 3. Build phases

### Phase 1 — Scaffold & foundation
- `npm create vite@latest . --template react-ts` inside `meeting-bingo/`
- Install `canvas-confetti`; dev-install `tailwindcss@3 postcss autoprefixer`, init Tailwind
- Add config: `tsconfig`, `vite.config.ts`, `tailwind.config.js`, `index.css` (Tailwind directives)
- Create `src/types/index.ts`, `src/data/categories.ts`, `src/lib/utils.ts` (the missing `cn`)

### Phase 2 — Core game (no audio) — *budget ~30 min*
- `lib/cardGenerator.ts`, `lib/bingoChecker.ts` (lift from docs)
- **Single state source:** App-level `useState` + `useGame` hook. No `GameContext`.
- Components: `LandingPage`, `CategorySelect` (with 2–3 **sample-word preview** per pack — US-1.2), `BingoSquare`, `BingoCard`, `GameControls`, `WinScreen`, `ui/{Button,Card,Toast}`
- `App.tsx` screen routing + game state with statuses `landing → select → setup → playing → won`
- **`setup` screen:** preview generated card, "New Card" regenerate, explicit Start (US-1.3)
- Manual square toggle → `checkForBingo` → win
- Progress: wire `getClosestToWin()` → "X/24 filled" counter + "One away!" indicator (US-3.2)
- **Outcome: fully playable by clicking**

### Phase 3 — Speech integration — *budget ~25 min*
- `hooks/useSpeechRecognition.ts`, `lib/wordDetector.ts`
- **Speech hook fix:** track listening intent in an `isListeningRef`; read it synchronously in `onend` to decide whether to restart. Keep `setState` pure — never call `recognition.start()` inside a `setState` updater (StrictMode double-fires it).
- **Error handling:** in `onerror`/`onend`, branch on `event.error`; do NOT auto-restart on `not-allowed`/`service-not-allowed`/`aborted`; add backoff to avoid hot-looping on `network`/`no-speech`.
- **Mic-consent step:** show "Audio is processed locally, never recorded" before listening; handle denied permission gracefully (US-2.1).
- **Auto-fill data flow (the core integration):**
  1. At card-gen, build a `Map<string, squareId>` of lowercased card words → square (excluding FREE space).
  2. De-dupe `WORD_ALIASES` against actual card words so a phrase (e.g. "continuous integration") fills exactly one square.
  3. On transcript update → `detectWordsWithAliases` → for each new word not in `alreadyFilled` (Set built with the same `.toLowerCase()` normalization) → immutably set `isFilled`/`isAutoFilled` on the matched square → `checkForBingo` → `onWin`.
  4. Fire a Toast per detected word; auto-fill completes <500ms; persistent visual distinction between auto vs manual fills.
- `TranscriptPanel` (live transcript + detected-word chips); cap stored transcript to a rolling buffer.
- Feature-detect + graceful fallback to manual-only mode when the API is unavailable (Firefox). Web Speech API requires a **secure context (HTTPS/localhost)** — non-HTTPS LAN testing silently disables the mic.

### Phase 4 — Polish & deploy — *budget ~15 min*
- `canvas-confetti` win celebration (discreet, **sound off by default** per UXR) + winning-line highlight
- `lib/shareUtils.ts` — clipboard + native share sheet; result summary with all 4 stats incl. **category played** (US-4.2)
- localStorage persistence (`useLocalStorage`, epoch-millis timestamps), mobile-responsive tweaks
- **Accessibility:** non-color filled indicator (check glyph + `aria-pressed`), `aria-live="polite"` for detected words + bingo, gate all animations behind `prefers-reduced-motion`
- **Deploy to Vercel** (the viral shareable URL — required by PRD/architecture, not just a local folder)

> **Drop order under the 90-min budget:** cut P2 items first (theme, peripheral layouts), then non-core polish — never the P0 setup/consent/auto-fill flow.

---

## 4. Target file structure

```
meeting-bingo/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/
    │   ├── LandingPage.tsx
    │   ├── CategorySelect.tsx
    │   ├── GameBoard.tsx
    │   ├── BingoCard.tsx
    │   ├── BingoSquare.tsx
    │   ├── TranscriptPanel.tsx
    │   ├── WinScreen.tsx
    │   ├── GameControls.tsx
    │   └── ui/{Button,Card,Toast}.tsx
    ├── hooks/
    │   ├── useSpeechRecognition.ts
    │   ├── useGame.ts          # single state source (no GameContext)
    │   └── useLocalStorage.ts
    ├── lib/
    │   ├── cardGenerator.ts
    │   ├── wordDetector.ts
    │   ├── bingoChecker.ts
    │   ├── shareUtils.ts
    │   └── utils.ts          # the missing cn() helper
    ├── data/
    │   └── categories.ts
    └── types/
        └── index.ts
```

> Removed from the original sketch: `context/GameContext.tsx` and `hooks/useBingoDetection.ts` — both overlapped the chosen `useGame` + `bingoChecker` approach (single state source).

---

## 5. Verification

- Card generates 24 unique words + center free space; regenerates differently each time
- All 12 winning lines detected (5 rows, 5 columns, 2 diagonals); free space counts toward every line
- Manual toggle fills/unfills; the same word spoken twice fills only once
- **Vitest unit tests pass:** `checkForBingo` (all 12 lines + free space), `detectWords` (word-boundary, phrase, and alias double-fill cases), `generateCard` (uniqueness)
- A phrase that is both a card word and an alias fills exactly one square (no double-fill)
- `aria-live` announces detected words/bingo; filled state perceivable without color; animations respect `prefers-reduced-motion`
- `npm run typecheck` and `npm run build` pass clean
- Manual smoke test in **Chrome, plus Safari (webkit prefix) and Firefox manual-only fallback**

> **Note:** Speech recognition needs a real browser + microphone permission, which can't be granted headlessly. The dev server and production build can be verified automatically, but the **final live mic test must be done by you** in a real browser.

---

## 6. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Web Speech API unavailable (e.g. Firefox) | Low | High | Feature-detect; fall back to manual-only mode — core game works without speech |
| Poor transcription accuracy | Medium | Medium | Manual tap always available; word aliases for common terms |
| Meeting audio not captured | Medium | Medium | User education (hold device near speaker); manual fallback |
| Cross-browser quirks | Low | Low | Target Chrome primarily; progressive enhancement |

---

## 7. Where it lands

The app is created in `meeting-bingo/` inside this project, alongside the existing `docs/MeetingBingo/` specs. The MVP is then **deployed to Vercel** to produce the shareable public URL (the viral distribution mechanism in the PRD); the local folder alone is not the deliverable.

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.1 | 2026-06-23 | Multi-perspective plan review (VP Product/Eng/Design): 3 Critical + 9 High issues addressed — added setup/preview + mic-consent flow, speech-hook `onend` fix, auto-fill data-flow spec, single-state-source decision, a11y + color-token alignment, Vercel deploy step, per-phase budgets, and unit tests. |
| 1.0 | 2026-06-23 | Initial implementation plan. |
