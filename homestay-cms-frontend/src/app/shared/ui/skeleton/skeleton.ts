import { Component, computed, input } from '@angular/core';

/**
 * A grey placeholder shaped like the content that is loading, so the page keeps its layout
 * (no jump when data arrives). Purely visual: it is hidden from screen readers, so each loading
 * region should carry one visually-hidden "Loading…" status of its own.
 *
 *   <app-skeleton height="2.5rem" width="60%" />       one bar
 *   <app-skeleton [lines]="3" />                       a paragraph (last line shorter)
 *   <app-skeleton ratio="4 / 3" />                     an image-shaped block
 *
 * The shimmer is a CSS animation that the global reduced-motion rule switches off.
 */
@Component({
  selector: 'app-skeleton',
  template: `
    @for (row of rows(); track row.index) {
      <span
        class="skeleton"
        aria-hidden="true"
        [style.width]="row.width"
        [style.height]="ratio() ? null : height()"
        [style.aspect-ratio]="ratio() || null"
      ></span>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 0.6rem;
      width: 100%;
    }
  `,
})
export class Skeleton {
  readonly lines = input(1);
  readonly width = input('100%');
  readonly height = input('1rem');
  /** CSS aspect-ratio, e.g. "16 / 9". When set it replaces the height. */
  readonly ratio = input('');

  protected readonly rows = computed(() => {
    const count = Math.max(1, this.lines());
    return Array.from({ length: count }, (_, index) => ({
      index,
      // A paragraph's last line is shorter, like real text.
      width: count > 1 && index === count - 1 ? '62%' : this.width(),
    }));
  });
}
