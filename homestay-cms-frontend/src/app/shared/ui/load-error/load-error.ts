import { Component, inject, output } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';

/** Shown when a page's data could not be loaded, with a retry that the page wires up. */
@Component({
  selector: 'app-load-error',
  template: `
    <div class="load-error" role="alert">
      <p>{{ i18n.t('common.loadError') }}</p>
      <button type="button" class="btn btn-quiet" (click)="retry.emit()">{{ i18n.t('common.retry') }}</button>
    </div>
  `,
  styles: `
    .load-error {
      max-width: 36rem;
      padding: 1.25rem 0;
    }

    p {
      margin: 0 0 1rem;
      line-height: 1.55;
    }
  `,
})
export class LoadError {
  protected readonly i18n = inject(I18nService);
  readonly retry = output<void>();
}
