import { Component, OnInit, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFoundPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  constructor() {
    effect(() => {
      this.seo.setPage(this.i18n.t('notFound.seoTitle'), this.i18n.t('notFound.seoDescription'));
    });
  }

  ngOnInit(): void {
    this.seo.setNoIndex();
  }
}
