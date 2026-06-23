# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is a **spec-first workshop repository**. As of now it contains **no application code** — only the planning documents for an app called **Meeting Bingo** under `docs/MeetingBingo/`. The intended deliverable is to build that app into a new `meeting-bingo/` directory at the repo root, then deploy it to Vercel.

The four spec docs are the source of truth, in increasing order of build-readiness:

| Doc | Role |
|-----|------|
| `docs/MeetingBingo/meeting-bingo-prd.md` | Product requirements — user stories with P0/P1/P2 priorities and acceptance criteria |
| `docs/MeetingBingo/meeting-bingo-uxr.md` | UX research — user scenarios, "trust moment" and "silent celebration" constraints |
| `docs/MeetingBingo/meeting-bingo-architecture.md` | Technical design — **contains working reference code** for the hard parts (card gen, BINGO checker, word detection, speech hook, type definitions, category data) |
| `docs/MeetingBingo/implementation-plan.md` | **The build guide.** Currently v1.1, reconciling the other three docs. Read this first before writing any app code. |

The implementation plan was hardened by a multi-VP review (see its `## Review Summary`). Treat its decisions as authoritative where the architecture doc's reference code conflicts with it — several reference snippets contain known issues the plan corrects (see Gotchas below).

## The app being built (Meeting Bingo)

A zero-backend, zero-cost browser bingo game: a 5×5 card of corporate/agile/tech buzzwords that auto-fills as the Web Speech API transcribes a live meeting, with manual tap as fallback.

**Stack:** Vite + React 18 + TypeScript + Tailwind CSS v3 + `canvas-confetti` + Web Speech API + localStorage. No backend, no API keys.

## Commands

The app does not exist yet. Scaffold it per `implementation-plan.md` Phase 1:

```bash
npm create vite@latest meeting-bingo -- --template react-ts
cd meeting-bingo && npm install canvas-confetti && npm install -D tailwindcss@3 postcss autoprefixer
```

Once `meeting-bingo/` exists, all commands run from inside it (scripts defined in the architecture doc's `package.json`):

```bash
npm run dev        # Vite dev server (port 3000)
npm run build      # tsc && vite build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint . --ext ts,tsx
npm run preview    # serve the production build
```

The plan calls for **Vitest** unit tests (not in the original package.json — add it): cover `checkForBingo` (all 12 lines + free space), `detectWords` (word-boundary, phrase, alias double-fill), and `generateCard` (uniqueness).

## Architecture notes for the build

- **Single state source.** Use App-level `useState` + a `useGame` hook. Do **not** create `context/GameContext.tsx` or `useBingoDetection.ts` — the plan removed both as overlapping the chosen approach, even though the architecture doc's structure lists them.
- **Screen flow:** `landing → select → setup → playing → won`. The `setup` status is a required card-preview/regenerate screen (P0 US-1.3) — do not skip straight to `playing` as the architecture doc's `App.tsx` sample does.
- **Auto-fill data flow** (the core integration, and the riskiest part): at card generation build a `Map<lowercased word → squareId>` excluding the FREE space; on each detected word not already filled, immutably update the square, then run `checkForBingo`, then `onWin`.
- **Secure context required.** The Web Speech API only works over HTTPS or `localhost`. Testing on a LAN IP silently disables the mic.
- **Mic consent is a P0 UX step** (US-2.1): show "audio is processed locally, never recorded" before listening, and handle denied permission gracefully.

## Gotchas inherited from the architecture reference code

The architecture doc's snippets are starting points, not final code. Known issues the implementation plan fixes:

- `useSpeechRecognition.onend` calls `recognition.start()` inside a `setState` updater that reads `prev.isListening` — an impure updater that StrictMode double-invokes, causing duplicate mic starts. Track intent in an `isListeningRef` read synchronously instead, and keep `setState` pure.
- Auto-restart in `onend`/`onerror` must branch on `event.error` — do not restart on `not-allowed`/`service-not-allowed`/`aborted`; add backoff to avoid hot-looping.
- `WORD_ALIASES` overlaps real card words (e.g. "continuous integration" is both an agile word and a `ci/cd` alias) → can double-fill. De-dupe aliases against card words; build the `alreadyFilled` Set with the same `.toLowerCase()` normalization `detectWords` uses.
- Accessibility is unaddressed in the samples: square state is color-only, auto-fills aren't announced, animations ignore `prefers-reduced-motion`. Add non-color indicators, `aria-live="polite"`, and reduced-motion gating.
- Hardcoded Tailwind colors in the samples (e.g. solid `blue-500` filled square) mismatch the PRD design tokens (`#dbeafe` light-blue + dark text). Map PRD tokens into the Tailwind theme.

## Constraints

This is framed as a 90-minute MVP build. Under time pressure, cut P2 items first (light/dark theme, peripheral/mobile layouts) — never the P0 setup/consent/auto-fill flow. Browser target is Chrome primarily, with manual-only fallback for Firefox and webkit-prefix handling for Safari.
