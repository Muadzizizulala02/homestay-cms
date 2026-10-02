import { describe, expect, it } from 'vitest';
import { iconFor, parsePolicy, rulesToItems, splitIntoCards, toItems, type PolicyItem } from './policy-parse';

const item = (n: number): PolicyItem => ({ heading: `H${n}`, body: `B${n}`, icon: 'info' });
const items = (count: number): PolicyItem[] => Array.from({ length: count }, (_, i) => item(i + 1));

describe('parsePolicy', () => {
  it('turns blank-line separated blocks into heading + body items', () => {
    const text = 'What we collect\nYour name and email.\n\nPayments\nYou pay on the provider page.\nWe never see card details.';
    expect(parsePolicy(text)).toEqual([
      { heading: 'What we collect', body: 'Your name and email.' },
      { heading: 'Payments', body: 'You pay on the provider page.\nWe never see card details.' },
    ]);
  });

  it('copes with Windows line endings and extra blank lines', () => {
    const text = 'A\r\nbody a\r\n\r\n\r\n\r\nB\r\nbody b\r\n';
    expect(parsePolicy(text).map((p) => p.heading)).toEqual(['A', 'B']);
  });

  it('keeps a block with no heading as body-only', () => {
    expect(parsePolicy('Just one plain paragraph that ends with a full stop.')).toEqual([
      { heading: '', body: 'Just one plain paragraph that ends with a full stop.' },
    ]);
  });

  it('does not mistake a long first sentence for a heading', () => {
    const long = 'This first line is much too long and ends like a sentence so it is body text, not a heading at all.\nSecond line.';
    expect(parsePolicy(long)[0].heading).toBe('');
  });

  it('ignores empty input', () => {
    expect(parsePolicy('')).toEqual([]);
    expect(parsePolicy('  \n \n ')).toEqual([]);
  });
});

describe('iconFor', () => {
  it('picks a sensible icon for the starter privacy headings', () => {
    expect(iconFor('What we collect')).toBe('description');
    expect(iconFor('Payments')).toBe('payments');
    expect(iconFor('Who can see your details')).toBe('visibility');
    expect(iconFor('Your choices')).toBe('tune');
    expect(iconFor('What your browser remembers')).toBe('web');
    expect(iconFor('Changes')).toBe('update');
  });

  it('picks sensible icons for the starter terms headings, and for Malay', () => {
    expect(iconFor('Bookings')).toBe('event');
    expect(iconFor('Guests and your stay')).toBe('groups');
    expect(iconFor('Prices')).toBe('sell');
    expect(iconFor('Changes and cancellations')).toBe('event_busy'); // cancel wins over change
    expect(iconFor('Questions')).toBe('help_outline');
    expect(iconFor('Pembayaran')).toBe('payments');
    expect(iconFor('Pilihan anda')).toBe('tune');
  });

  it('picks icons for house rules', () => {
    expect(iconFor('No smoking indoors.')).toBe('smoke_free');
    expect(iconFor('Please keep noise down from 11pm to 7am.')).toBe('volume_off');
    expect(iconFor('Please remove your shoes before coming in.')).toBe('do_not_step');
    expect(iconFor('Only the guests named in the booking may stay overnight.')).toBe('groups');
    expect(iconFor('Dilarang merokok di dalam rumah.')).toBe('smoke_free');
  });

  it('falls back to the given icon when nothing matches', () => {
    expect(iconFor('Something unusual')).toBe('info');
    expect(iconFor('Something unusual', 'rule')).toBe('rule');
  });
});

describe('toItems and rulesToItems', () => {
  it('adds an icon to each parsed item', () => {
    expect(toItems('Payments\nPay online.')).toEqual([{ heading: 'Payments', body: 'Pay online.', icon: 'payments' }]);
  });

  it('shows each house rule as a heading-only item with its own icon', () => {
    expect(rulesToItems(['No smoking indoors.', '  ', 'Be kind.'])).toEqual([
      { heading: 'No smoking indoors.', body: '', icon: 'smoke_free' },
      { heading: 'Be kind.', body: '', icon: 'rule' },
    ]);
  });
});

describe('splitIntoCards', () => {
  it('uses one card for one or two items', () => {
    expect(splitIntoCards(items(1))).toEqual({ left: items(1), right: [], bottom: [] });
    expect(splitIntoCards(items(2)).right).toEqual([]);
  });

  it('splits into two side-by-side cards, the left one taking the extra', () => {
    const r = splitIntoCards(items(5));
    expect(r.left.map((i) => i.heading)).toEqual(['H1', 'H2', 'H3']);
    expect(r.right.map((i) => i.heading)).toEqual(['H4', 'H5']);
    expect(r.bottom).toEqual([]);
    expect(splitIntoCards(items(6)).left).toHaveLength(3);
    expect(splitIntoCards(items(6)).right).toHaveLength(3);
  });

  it('puts anything beyond eight into a full-width card underneath, like the reference', () => {
    const r = splitIntoCards(items(10));
    expect(r.left).toHaveLength(4);
    expect(r.right).toHaveLength(4);
    expect(r.bottom.map((i) => i.heading)).toEqual(['H9', 'H10']);
  });

  it('keeps every item exactly once, in order', () => {
    for (const n of [0, 1, 2, 3, 4, 7, 8, 9, 12]) {
      const r = splitIntoCards(items(n));
      expect([...r.left, ...r.right, ...r.bottom]).toEqual(items(n));
    }
  });
});
