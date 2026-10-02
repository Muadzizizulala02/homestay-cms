import { describe, expect, it } from 'vitest';
import { nextIndex, resolveIndex } from './slideshow-logic';

describe('nextIndex', () => {
  it('advances by one', () => {
    expect(nextIndex(0, 4)).toBe(1);
    expect(nextIndex(2, 4)).toBe(3);
  });

  it('wraps from the last slide to the first', () => {
    expect(nextIndex(3, 4)).toBe(0);
  });

  it('stays on the only slide', () => {
    expect(nextIndex(0, 1)).toBe(0);
  });

  it('returns 0 when there are no slides', () => {
    expect(nextIndex(0, 0)).toBe(0);
  });
});

describe('resolveIndex', () => {
  it('keeps a valid index', () => {
    expect(resolveIndex(2, 4)).toBe(2);
  });

  it('falls back to 0 when the list shrank or is empty', () => {
    expect(resolveIndex(3, 2)).toBe(0);
    expect(resolveIndex(0, 0)).toBe(0);
    expect(resolveIndex(-1, 3)).toBe(0);
  });
});
