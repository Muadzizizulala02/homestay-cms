import { describe, expect, it } from 'vitest';
import { DEFAULT_TYPING, cycleLength, frameAt, splitAt, type TypingConfig } from './typing-logic';

// A simple clock: 100 ms per headline char, 50 per lead char, so the numbers are easy to read.
const cfg: TypingConfig = {
  startDelayMs: 200,
  headMsPerChar: 100,
  leadMsPerChar: 50,
  gapMs: 100,
  holdMs: 1000,
  eraseLeadMsPerChar: 10,
  eraseHeadMsPerChar: 20,
  restMs: 300,
};
const H = 4; // headline length
const L = 6; // lead length

describe('frameAt', () => {
  it('shows nothing during the start delay', () => {
    expect(frameAt(0, H, L, cfg)).toEqual({ head: 0, lead: 0, caret: 'head' });
    expect(frameAt(199, H, L, cfg)).toEqual({ head: 0, lead: 0, caret: 'head' });
  });

  it('types the headline one character at a time, caret on the headline', () => {
    expect(frameAt(200 + 100, H, L, cfg)).toEqual({ head: 1, lead: 0, caret: 'head' });
    expect(frameAt(200 + 250, H, L, cfg)).toEqual({ head: 2, lead: 0, caret: 'head' });
  });

  it('then moves the caret to the lead and types it', () => {
    expect(frameAt(200 + 400 + 50, H, L, cfg)).toEqual({ head: H, lead: 0, caret: 'lead' }); // in the gap
    expect(frameAt(200 + 400 + 100 + 150, H, L, cfg)).toEqual({ head: H, lead: 3, caret: 'lead' });
  });

  it('holds with everything typed', () => {
    const t = 200 + 400 + 100 + 300 + 500; // mid-hold
    expect(frameAt(t, H, L, cfg)).toEqual({ head: H, lead: L, caret: 'lead' });
  });

  it('erases the lead, then the headline, then rests empty', () => {
    const afterHold = 200 + 400 + 100 + 300 + 1000;
    expect(frameAt(afterHold + 30, H, L, cfg)).toEqual({ head: H, lead: 3, caret: 'lead' });
    expect(frameAt(afterHold + 60 + 40, H, L, cfg)).toEqual({ head: 2, lead: 0, caret: 'head' });
    expect(frameAt(afterHold + 60 + 80 + 100, H, L, cfg)).toEqual({ head: 0, lead: 0, caret: 'head' });
  });

  it('loops forever: a later cycle repeats the same typing, without the start delay', () => {
    const cycle = cycleLength(H, L, cfg);
    const firstTyping = frameAt(200 + 250, H, L, cfg);
    expect(frameAt(200 + cycle + 250, H, L, cfg)).toEqual(firstTyping);
    expect(frameAt(200 + 5 * cycle + 250, H, L, cfg)).toEqual(firstTyping);
  });

  it('never reports more characters than exist', () => {
    for (let t = 0; t < 20000; t += 37) {
      const f = frameAt(t, H, L, cfg);
      expect(f.head).toBeGreaterThanOrEqual(0);
      expect(f.head).toBeLessThanOrEqual(H);
      expect(f.lead).toBeGreaterThanOrEqual(0);
      expect(f.lead).toBeLessThanOrEqual(L);
    }
  });

  it('copes with an empty lead (headline only)', () => {
    const f = frameAt(200 + 400 + 500, H, 0, cfg);
    expect(f.head).toBe(H);
    expect(f.lead).toBe(0);
  });

  it('copes with no text at all', () => {
    expect(frameAt(5000, 0, 0, cfg)).toEqual({ head: 0, lead: 0, caret: 'head' });
  });

  it('has sensible defaults: a visible hold and a finite cycle', () => {
    expect(DEFAULT_TYPING.holdMs).toBeGreaterThanOrEqual(3000);
    expect(cycleLength(12, 75, DEFAULT_TYPING)).toBeGreaterThan(5000);
  });
});

describe('splitAt', () => {
  it('splits into the typed part and the rest', () => {
    expect(splitAt('Our Homestay', 3)).toEqual({ on: 'Our', off: ' Homestay' });
    expect(splitAt('abc', 0)).toEqual({ on: '', off: 'abc' });
    expect(splitAt('abc', 3)).toEqual({ on: 'abc', off: '' });
  });

  it('counts whole characters, not UTF-16 halves (emoji stay intact)', () => {
    expect(splitAt('a😀b', 2)).toEqual({ on: 'a😀', off: 'b' });
  });

  it('clamps out-of-range counts', () => {
    expect(splitAt('abc', 99)).toEqual({ on: 'abc', off: '' });
    expect(splitAt('abc', -5)).toEqual({ on: '', off: 'abc' });
  });
});
