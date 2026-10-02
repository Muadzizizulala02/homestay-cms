/** Timings (milliseconds) for the hero typing loop. */
export interface TypingConfig {
  /** Wait before the very first character (first cycle only). */
  startDelayMs: number;
  headMsPerChar: number;
  leadMsPerChar: number;
  /** Beat between finishing the headline and starting the intro line. */
  gapMs: number;
  /** How long the finished text stays on screen. */
  holdMs: number;
  eraseLeadMsPerChar: number;
  eraseHeadMsPerChar: number;
  /** Empty pause before typing starts again. */
  restMs: number;
}

/**
 * Headline types at a deliberate pace, the intro line a little faster, both rest on screen for a
 * few seconds so they can be read, then erase quickly and the loop starts over.
 */
export const DEFAULT_TYPING: TypingConfig = {
  startDelayMs: 400,
  headMsPerChar: 85,
  leadMsPerChar: 32,
  gapMs: 350,
  holdMs: 5200,
  eraseLeadMsPerChar: 9,
  eraseHeadMsPerChar: 24,
  restMs: 700,
};

export interface TypingFrame {
  /** Characters of the headline currently shown. */
  head: number;
  /** Characters of the intro line currently shown. */
  lead: number;
}

/** Length of one full type-hold-erase-rest loop. */
export function cycleLength(headLen: number, leadLen: number, cfg: TypingConfig = DEFAULT_TYPING): number {
  return (
    headLen * cfg.headMsPerChar +
    cfg.gapMs +
    leadLen * cfg.leadMsPerChar +
    cfg.holdMs +
    leadLen * cfg.eraseLeadMsPerChar +
    headLen * cfg.eraseHeadMsPerChar +
    cfg.restMs
  );
}

/**
 * What is on screen `elapsedMs` after the animation started. A pure function of time, so it is
 * deterministic, easy to test, and a paused/hidden tab just stops advancing `elapsedMs`.
 */
export function frameAt(elapsedMs: number, headLen: number, leadLen: number, cfg: TypingConfig = DEFAULT_TYPING): TypingFrame {
  const sinceStart = elapsedMs - cfg.startDelayMs;
  if (sinceStart < 0 || (headLen === 0 && leadLen === 0)) {
    return { head: 0, lead: 0 };
  }

  let t = sinceStart % cycleLength(headLen, leadLen, cfg);

  const typeHead = headLen * cfg.headMsPerChar;
  if (t < typeHead) {
    return { head: Math.min(headLen, Math.floor(t / cfg.headMsPerChar)), lead: 0 };
  }
  t -= typeHead;

  if (t < cfg.gapMs) {
    return { head: headLen, lead: 0 };
  }
  t -= cfg.gapMs;

  const typeLead = leadLen * cfg.leadMsPerChar;
  if (t < typeLead) {
    return { head: headLen, lead: Math.min(leadLen, Math.floor(t / cfg.leadMsPerChar)) };
  }
  t -= typeLead;

  if (t < cfg.holdMs) {
    return { head: headLen, lead: leadLen };
  }
  t -= cfg.holdMs;

  const eraseLead = leadLen * cfg.eraseLeadMsPerChar;
  if (t < eraseLead) {
    return { head: headLen, lead: Math.max(0, leadLen - Math.floor(t / cfg.eraseLeadMsPerChar)) };
  }
  t -= eraseLead;

  const eraseHead = headLen * cfg.eraseHeadMsPerChar;
  if (t < eraseHead) {
    return { head: Math.max(0, headLen - Math.floor(t / cfg.eraseHeadMsPerChar)), lead: 0 };
  }

  return { head: 0, lead: 0 };
}

/** Splits text after `count` whole characters (so emoji are never cut in half). */
export function splitAt(text: string, count: number): { on: string; off: string } {
  const chars = Array.from(text);
  const n = Math.max(0, Math.min(chars.length, count));
  return { on: chars.slice(0, n).join(''), off: chars.slice(n).join('') };
}
