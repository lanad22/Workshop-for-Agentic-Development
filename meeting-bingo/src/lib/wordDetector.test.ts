import { describe, it, expect } from 'vitest';
import { buildCardAliases, detectWords, detectWordsWithAliases } from './wordDetector';

const empty = new Set<string>();

describe('detectWords — word boundaries', () => {
  it('matches a whole word', () => {
    expect(detectWords('the daily scrum is at nine', ['scrum'], empty)).toEqual(['scrum']);
  });

  it('does NOT match inside a larger word', () => {
    expect(detectWords('that was a real scrummage', ['scrum'], empty)).toEqual([]);
  });

  it('is case-insensitive', () => {
    expect(detectWords('we START the SPRINT now', ['sprint'], empty)).toEqual(['sprint']);
  });

  it('skips already-filled words', () => {
    expect(detectWords('sprint sprint', ['sprint'], new Set(['sprint']))).toEqual([]);
  });
});

describe('detectWords — phrases & punctuation', () => {
  it('matches a multi-word phrase as a substring', () => {
    expect(detectWords('please estimate the story points', ['story points'], empty)).toEqual([
      'story points',
    ]);
  });

  it('matches words containing punctuation (ci/cd)', () => {
    expect(detectWords('our ci/cd pipeline is green', ['CI/CD'], empty)).toEqual(['CI/CD']);
  });
});

describe('detectWordsWithAliases — no double-fill', () => {
  it('fills exactly one square when a phrase is both a card word and an alias', () => {
    const cardWords = ['CI/CD', 'continuous integration'];
    const aliases = buildCardAliases(cardWords);
    const detected = detectWordsWithAliases('we invested in continuous integration', cardWords, empty, aliases);
    expect(detected).toEqual(['continuous integration']); // NOT also CI/CD
    expect(detected).toHaveLength(1);
  });

  it('still resolves an alias to its canonical card word when the phrase is not itself on the card', () => {
    const cardWords = ['CI/CD'];
    const aliases = buildCardAliases(cardWords);
    const detected = detectWordsWithAliases('the continuous integration server', cardWords, empty, aliases);
    expect(detected).toEqual(['CI/CD']);
  });
});
