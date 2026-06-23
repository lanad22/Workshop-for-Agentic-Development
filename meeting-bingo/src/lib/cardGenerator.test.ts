import { describe, it, expect } from 'vitest';
import { buildWordIndex, generateCard, FREE_SPACE_WORD } from './cardGenerator';

describe('generateCard', () => {
  it('produces a 5×5 grid with a pre-filled center free space', () => {
    const card = generateCard('agile');
    const flat = card.squares.flat();
    expect(flat).toHaveLength(25);

    const center = card.squares[2][2];
    expect(center.isFreeSpace).toBe(true);
    expect(center.word).toBe(FREE_SPACE_WORD);
    expect(center.isFilled).toBe(true);
    expect(typeof center.filledAt).toBe('number');
  });

  it('uses 24 unique non-free words, all initially unfilled', () => {
    const card = generateCard('tech');
    const nonFree = card.squares.flat().filter((sq) => !sq.isFreeSpace);
    expect(nonFree).toHaveLength(24);
    expect(new Set(nonFree.map((sq) => sq.word)).size).toBe(24);
    expect(nonFree.every((sq) => !sq.isFilled)).toBe(true);
  });

  it('gives each square a stable row-col id', () => {
    const card = generateCard('corporate');
    expect(card.squares[3][1].id).toBe('3-1');
  });

  it('regenerates a different card (shuffled)', () => {
    const cards = Array.from({ length: 4 }, () => generateCard('corporate').words.join('|'));
    expect(new Set(cards).size).toBeGreaterThan(1);
  });
});

describe('buildWordIndex', () => {
  it('maps lowercased words to ids and excludes the free space', () => {
    const card = generateCard('agile');
    const index = buildWordIndex(card);
    expect(index.size).toBe(24);
    expect([...index.keys()]).not.toContain(FREE_SPACE_WORD.toLowerCase());

    const sample = card.squares.flat().find((sq) => !sq.isFreeSpace)!;
    expect(index.get(sample.word.toLowerCase())).toBe(sample.id);
  });
});
