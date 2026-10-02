import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../i18n/i18n.service';
import { clampInterval } from '../../i18n/localize';
import { nextIndex, resolveIndex } from './slideshow-logic';

/** Cross-fading hero photos. Fills its positioned parent; the page supplies the scrim and text above it. */
@Component({
  selector: 'app-hero-slideshow',
  imports: [MatIconModule],
  templateUrl: './hero-slideshow.html',
  styleUrl: './hero-slideshow.scss',
})
export class HeroSlideshow {
  protected readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);

  readonly slides = input<string[]>([]);
  readonly intervalSeconds = input<number>(5);

  private readonly requestedIndex = signal(0);
  private readonly userPaused = signal(false);
  private readonly tabHidden = signal(false);
  protected readonly reducedMotion = signal(false);

  protected readonly count = computed(() => this.slides().length);
  protected readonly current = computed(() => resolveIndex(this.requestedIndex(), this.count()));
  protected readonly multiple = computed(() => this.count() > 1);
  protected readonly paused = computed(() => this.userPaused());
  private readonly running = computed(() => this.multiple() && !this.userPaused() && !this.tabHidden());

  constructor() {
    const win = this.document.defaultView;
    const reduce =
      win && typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (reduce?.matches) {
      this.reducedMotion.set(true);
      this.userPaused.set(true);
    }

    const onVisibility = () => this.tabHidden.set(this.document.visibilityState === 'hidden');
    onVisibility();
    this.document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => this.document.removeEventListener('visibilitychange', onVisibility));

    // One timer per shown slide: choosing a slide by hand re-arms it, so the new photo gets its full time.
    effect((onCleanup) => {
      if (!this.running()) {
        return;
      }
      const total = this.count();
      const index = this.current();
      const ms = clampInterval(this.intervalSeconds()) * 1000;
      const timer = setTimeout(() => this.requestedIndex.set(nextIndex(index, total)), ms);
      onCleanup(() => clearTimeout(timer));
    });

    // Warm the next photo so the cross-fade never shows a blank frame.
    effect(() => {
      const list = this.slides();
      if (list.length > 1) {
        new Image().src = list[nextIndex(this.current(), list.length)];
      }
    });
  }

  protected togglePause(): void {
    this.userPaused.update((paused) => !paused);
  }

  protected show(index: number): void {
    this.requestedIndex.set(index);
  }
}
