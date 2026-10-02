/** One entry in a policy card: a ringed icon, an optional heading and an optional description. */
export interface PolicyItem {
  heading: string;
  body: string;
  /** A classic Material icon name. */
  icon: string;
}

const MAX_HEADING_LENGTH = 70;

/**
 * Splits admin-written policy text into items. Blocks are separated by blank lines; when a block
 * starts with a short line that is not a sentence (no closing full stop), that line is its heading
 * and the rest is its description. Anything else is shown as description-only text, so free-form
 * writing still reads well.
 */
export function parsePolicy(text: string): Array<{ heading: string; body: string }> {
  return (text ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .filter((lines) => lines.length > 0)
    .map((lines) => {
      const [first, ...rest] = lines;
      const looksLikeHeading = rest.length > 0 && first.length <= MAX_HEADING_LENGTH && !/[.!?。]$/.test(first);
      return looksLikeHeading ? { heading: first, body: rest.join('\n') } : { heading: '', body: lines.join('\n') };
    });
}

// Ordered: the first matching keyword wins, so more specific topics sit above general ones
// ("cancel" above "change"; "guest" above "booking"). Only long-standing Material icon names are
// used, so none can fail to render in the icon font.
const ICON_RULES: ReadonlyArray<readonly [readonly string[], string]> = [
  [['smok', 'merokok'], 'smoke_free'],
  [['pets', 'pet ', 'haiwan'], 'pets'],
  [['noise', 'quiet', 'bising', 'senyap'], 'volume_off'],
  [['shoe', 'kasut'], 'do_not_step'],
  [['alcohol', 'halal'], 'no_drinks'],
  [['guest', 'tetamu', 'overnight', 'bermalam'], 'groups'],
  [['payment', 'bayaran', 'pembayaran'], 'payments'],
  [['collect', 'kumpul'], 'description'],
  [['who can see', 'siapa yang', 'visible'], 'visibility'],
  [['choice', 'pilihan'], 'tune'],
  [['browser', 'cookie', 'kuki', 'pelayar'], 'web'],
  [['price', 'harga'], 'sell'],
  [['cancel', 'batal'], 'event_busy'],
  [['change', 'perubahan'], 'update'],
  [['question', 'pertanyaan', 'soalan'], 'help_outline'],
  [['booking', 'tempahan'], 'event'],
];

/** A fitting icon for a heading or rule, falling back to a generic one. */
export function iconFor(text: string, fallback = 'info'): string {
  const lower = ` ${(text ?? '').toLowerCase()} `;
  for (const [keywords, icon] of ICON_RULES) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return icon;
    }
  }
  return fallback;
}

export function toItems(text: string): PolicyItem[] {
  return parsePolicy(text).map(({ heading, body }) => ({ heading, body, icon: iconFor(heading || body) }));
}

/** House rules are single sentences, so each becomes a heading-only item. */
export function rulesToItems(rules: readonly string[]): PolicyItem[] {
  return rules
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => ({ heading: rule, body: '', icon: iconFor(rule, 'rule') }));
}

const TOP_CARDS_CAPACITY = 8;

/**
 * Lays items out like the reference: two side-by-side cards (the left one takes any odd item), and
 * anything beyond eight in a full-width card underneath. One or two items share a single card.
 */
export function splitIntoCards(all: readonly PolicyItem[]): { left: PolicyItem[]; right: PolicyItem[]; bottom: PolicyItem[] } {
  const top = all.slice(0, TOP_CARDS_CAPACITY);
  const bottom = all.slice(TOP_CARDS_CAPACITY);
  if (top.length <= 2) {
    return { left: [...top], right: [], bottom: [...bottom] };
  }
  const leftCount = Math.ceil(top.length / 2);
  return { left: top.slice(0, leftCount), right: top.slice(leftCount), bottom: [...bottom] };
}
