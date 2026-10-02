import { Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * Eases an image in once it has loaded, instead of it popping in half-drawn.
 *
 *   <img appImgFade [src]="url" alt="" />
 *
 * Styles live in styles.scss (`.img-fade`). A failed load is also marked loaded, so a broken image
 * never stays invisible waiting for an event that will not come.
 */
@Directive({
  selector: 'img[appImgFade]',
  host: {
    class: 'img-fade',
    '[class.is-loaded]': 'loaded()',
    '(load)': 'loaded.set(true)',
    '(error)': 'loaded.set(true)',
  },
})
export class ImgFade {
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef);
  protected readonly loaded = signal(false);

  constructor() {
    // A cached image can finish loading before this directive is attached, so its `load` event is missed.
    afterNextRender(() => {
      if (this.image.nativeElement.complete) {
        this.loaded.set(true);
      }
    });
  }
}
