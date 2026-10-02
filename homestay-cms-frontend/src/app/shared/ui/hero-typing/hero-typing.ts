import { DOCUMENT } from '@angular/common';
import { type Signal, computed, effect, inject, signal } from '@angular/core';
import { DEFAULT_TYPING, frameAt, splitAt, type TypingFrame } from './typing-logic';

export interface HeroTyping {
  /** The headline split into the typed part and the part still to come. */
  head: Signal<{ on: string; off: string }>;
  /** The intro line, likewise. */
  lead: Signal<{ on: string; off: string }>;
  /** Which line the caret is on, or `none` when nothing is animating. */
  caret: Signal<'head' | 'lead' | 'none'>;
}

const TICK_MS = 40;

/**
 * A looping typewriter for the hero's headline and intro line. Call it in an injection context
 * (a component field) with the two texts; render `on` visibly and `off` invisibly in the SAME text
 * flow, so the line breaks never move while typing. The full text must also be present for
 * screen readers (visually hidden), because the animated spans are `aria-hidden`.
 *
 * With `prefers-reduced-motion`, or no text to type, it simply shows the full text. The loop
 * pauses while the tab is hidden and restarts when the text (or language) changes.
 */
export function injectHeroTyping(headline: Signal<string>, lead: Signal<string>): HeroTyping {
  const document = inject(DOCUMENT);
  const win = document.defaultView;
  const reduceMotion = !!win && typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const frame = signal<TypingFrame>({ head: 0, lead: 0, caret: 'head' });
  const headLen = computed(() => Array.from(headline()).length);
  const leadLen = computed(() => Array.from(lead()).length);

  effect((onCleanup) => {
    const h = headLen();
    const l = leadLen();

    if (reduceMotion || (h === 0 && l === 0)) {
      frame.set({ head: h, lead: l, caret: 'head' });
      return;
    }

    // Time spent hidden is not counted, so the loop resumes exactly where it stopped.
    let elapsed = 0;
    let last = performance.now();
    frame.set(frameAt(0, h, l, DEFAULT_TYPING));

    const timer = setInterval(() => {
      const now = performance.now();
      if (document.visibilityState !== 'hidden') {
        elapsed += now - last;
        const next = frameAt(elapsed, h, l, DEFAULT_TYPING);
        const current = frame();
        if (next.head !== current.head || next.lead !== current.lead || next.caret !== current.caret) {
          frame.set(next);
        }
      }
      last = now;
    }, TICK_MS);

    onCleanup(() => clearInterval(timer));
  });

  return {
    head: computed(() => splitAt(headline(), frame().head)),
    lead: computed(() => splitAt(lead(), frame().lead)),
    caret: computed(() => (reduceMotion ? 'none' : frame().caret)),
  };
}
