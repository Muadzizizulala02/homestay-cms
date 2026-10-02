import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

/**
 * Fades and lifts an element into place the first time it scrolls into view.
 *
 *   <section appReveal>…</section>              reveals as soon as it is visible
 *   <li [appReveal]="index * 90">…</li>         same, after a delay in ms (for staggering a list)
 *
 * The hidden/visible styles live in styles.scss (`.reveal`). Nothing is ever left hidden: with
 * reduced motion, or in a browser without IntersectionObserver, the element is shown immediately.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    class: 'reveal',
    '[class.is-visible]': 'visible()',
    '[style.--reveal-delay]': 'delayValue()',
  },
})
export class Reveal {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** Optional delay in milliseconds. `appReveal` with no value means no delay. */
  readonly delay = input<number | string>(0, { alias: 'appReveal' });

  protected readonly visible = signal(false);
  protected delayValue(): string {
    return `${Number(this.delay()) || 0}ms`;
  }

  constructor() {
    afterNextRender(() => {
      const reduceMotion =
        typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion || typeof IntersectionObserver === 'undefined') {
        this.visible.set(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            this.visible.set(true);
            observer.disconnect();
          }
        },
        // Reveal a little before the element's edge is fully inside, so it is already settling as it arrives.
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
      );
      observer.observe(this.element.nativeElement);
      // Released on first reveal, or when the element is removed before it was ever seen.
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
