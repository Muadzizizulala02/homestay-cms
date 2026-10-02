const MIN_LEAD_LENGTH = 25;

/**
 * Splits the admin's "about" text for an editorial layout: a large lead and the remainder. With
 * several paragraphs the first is the lead; with one, the first sentence is (so a very short
 * opening fragment such as "Hi." is not left stranded as the whole lead).
 */
export function splitLead(text: string): { lead: string; rest: string } {
  const clean = (text ?? '').replace(/\r\n?/g, '\n').trim();
  if (!clean) {
    return { lead: '', rest: '' };
  }

  const paragraphs = clean.split(/\n\s*\n/);
  if (paragraphs.length > 1) {
    return { lead: paragraphs[0].trim(), rest: paragraphs.slice(1).join('\n\n').trim() };
  }

  // First sentence end that leaves a sensible-length lead: ". " / "! " / "? " followed by more text.
  const pattern = /[.!?]\s+/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(clean)) !== null) {
    const end = match.index + 1; // keep the punctuation
    if (end >= MIN_LEAD_LENGTH) {
      return { lead: clean.slice(0, end).trim(), rest: clean.slice(match.index + match[0].length).trim() };
    }
  }
  return { lead: clean, rest: '' };
}
