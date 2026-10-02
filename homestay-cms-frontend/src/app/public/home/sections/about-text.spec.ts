import { describe, expect, it } from 'vitest';
import { splitLead } from './about-text';

describe('splitLead', () => {
  it('uses the first paragraph as the lead when there are several', () => {
    const text = 'We are a family-run stay.\n\nBreakfast is nearby.\nParking is free.';
    expect(splitLead(text)).toEqual({ lead: 'We are a family-run stay.', rest: 'Breakfast is nearby.\nParking is free.' });
  });

  it('uses the first sentence as the lead when it is one paragraph', () => {
    const text = 'We offer comfortable rooms for short and longer stays. Choose your dates to see which rooms are available.';
    expect(splitLead(text)).toEqual({
      lead: 'We offer comfortable rooms for short and longer stays.',
      rest: 'Choose your dates to see which rooms are available.',
    });
  });

  it('keeps a single short sentence whole, with nothing left over', () => {
    expect(splitLead('A quiet place to stay.')).toEqual({ lead: 'A quiet place to stay.', rest: '' });
  });

  it('does not cut a sentence at a tiny first fragment', () => {
    const text = 'Hi. We are a small family stay near the town centre. Come and see.';
    // "Hi." is too short to be a lead on its own, so the lead runs to the next sentence end.
    expect(splitLead(text).lead).toBe('Hi. We are a small family stay near the town centre.');
  });

  it('handles Windows line endings and surrounding whitespace', () => {
    expect(splitLead('  First paragraph.\r\n\r\nSecond paragraph.  ')).toEqual({ lead: 'First paragraph.', rest: 'Second paragraph.' });
  });

  it('copes with empty text and text with no full stop', () => {
    expect(splitLead('')).toEqual({ lead: '', rest: '' });
    expect(splitLead('No full stop here at all')).toEqual({ lead: 'No full stop here at all', rest: '' });
  });

  it('works for Malay text too', () => {
    const text = 'Kami menyediakan bilik yang selesa untuk penginapan singkat dan panjang. Pilih tarikh anda untuk melihat bilik.';
    expect(splitLead(text).lead).toBe('Kami menyediakan bilik yang selesa untuk penginapan singkat dan panjang.');
  });
});
