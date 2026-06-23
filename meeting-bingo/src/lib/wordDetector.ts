// src/lib/wordDetector.ts
// Buzzword matching against a transcript. Single words match on word
// boundaries; multi-word phrases match as substrings. Aliases let spoken
// variants ("continuous integration") fill a canonical card word ("CI/CD").

/** Escape regex metacharacters so card words like "ci/cd" or "a/b test" are literal. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Lowercase + normalize smart quotes so transcript and card words compare cleanly. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .trim();
}

/** Canonical card word → spoken variants that should also fill it. */
export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration'],
  mvp: ['minimum viable product'],
  roi: ['return on investment'],
  devops: ['dev ops', 'dev-ops'],
  api: ['a p i'],
  'a/b test': ['a b test', 'ab test', 'split test'],
};

/**
 * De-dupe the global alias table against THIS card's words so a single spoken
 * phrase fills exactly one square. Example: if a card holds both "CI/CD" and
 * "continuous integration", the "continuous integration" alias is dropped from
 * CI/CD — otherwise saying it would fill both squares (the documented gotcha).
 */
export function buildCardAliases(cardWords: string[]): Record<string, string[]> {
  const cardSet = new Set(cardWords.map(normalizeText));
  const result: Record<string, string[]> = {};

  for (const [canonical, aliases] of Object.entries(WORD_ALIASES)) {
    if (!cardSet.has(normalizeText(canonical))) continue; // canonical isn't on this card
    const filtered = aliases.filter((alias) => !cardSet.has(normalizeText(alias)));
    if (filtered.length > 0) result[canonical] = filtered;
  }

  return result;
}

/**
 * Detect which `cardWords` appear in `transcript`, skipping any already filled.
 * `alreadyFilled` must be keyed with the SAME .toLowerCase() normalization used
 * here, so a word never re-fills.
 */
export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normalized = normalizeText(transcript);
  const detected: string[] = [];

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;

    const normalizedWord = normalizeText(word);

    if (normalizedWord.includes(' ') || /[^a-z0-9]/.test(normalizedWord)) {
      // Phrases and words with punctuation (ci/cd, a/b test) match as substrings.
      if (normalized.includes(normalizedWord)) detected.push(word);
    } else {
      // Plain single words match on word boundaries (no "scrum" in "scrummage").
      const regex = new RegExp(`\\b${escapeRegex(normalizedWord)}\\b`, 'i');
      if (regex.test(normalized)) detected.push(word);
    }
  }

  return detected;
}

/**
 * Like {@link detectWords} but also matches the per-card alias variants. Pass a
 * card-specific alias map from {@link buildCardAliases} to avoid double-fills.
 */
export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
  aliases: Record<string, string[]> = WORD_ALIASES,
): string[] {
  const detected = detectWords(transcript, cardWords, alreadyFilled);
  const seen = new Set(detected.map((w) => w.toLowerCase()));
  const normalized = normalizeText(transcript);

  for (const word of cardWords) {
    const key = word.toLowerCase();
    if (alreadyFilled.has(key) || seen.has(key)) continue;

    const variants = aliases[key];
    if (!variants) continue;

    if (variants.some((alias) => normalized.includes(normalizeText(alias)))) {
      detected.push(word);
      seen.add(key);
    }
  }

  return detected;
}
