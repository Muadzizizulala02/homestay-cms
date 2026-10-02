import { Component, OnInit, computed, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { LoadError } from '../../shared/ui/load-error/load-error';
import { Skeleton } from '../../shared/ui/skeleton/skeleton';

type PolicyKind = 'privacy' | 'terms';

/** One page for both /privacy and /terms; the route's `data.policy` picks which text to show. */
@Component({
  selector: 'app-policy-page',
  imports: [LoadError, Skeleton],
  templateUrl: './policy.html',
  styleUrl: './policy.scss',
})
export class PolicyPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly siteContent = inject(SiteContentService);
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  readonly content = this.siteContent.content;
  readonly failed = this.siteContent.failed;

  private readonly kind = toSignal(
    this.route.data.pipe(map((data): PolicyKind => (data['policy'] === 'terms' ? 'terms' : 'privacy'))),
    { initialValue: 'privacy' as PolicyKind },
  );

  readonly title = computed(() => this.i18n.t(`policy.${this.kind()}.title`));
  readonly text = computed(() => {
    const c = this.content();
    if (!c) {
      return '';
    }
    return (this.kind() === 'terms' ? c.termsAndConditions : c.privacyPolicy) ?? '';
  });

  constructor() {
    effect(() => {
      this.seo.setPage(this.title(), this.i18n.t(`policy.${this.kind()}.seoDescription`));
    });
  }

  ngOnInit(): void {
    this.siteContent.ensureLoaded();
  }

  retry(): void {
    this.siteContent.ensureLoaded();
  }
}
