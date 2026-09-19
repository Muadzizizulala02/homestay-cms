import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';

@Component({
  selector: 'app-accommodation-detail',
  imports: [RouterLink],
  templateUrl: './accommodation-detail.html',
  styleUrl: './accommodation-detail.scss',
})
export class AccommodationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly unit = signal<Accommodation | null>(null);
  readonly notFound = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.accommodationService.getPublicBySlug(slug).subscribe({
      next: (unit) => {
        this.unit.set(unit);
        this.seo.setPage(unit.name, unit.description.slice(0, 160));
      },
      error: () => this.notFound.set(true),
    });
  }
}
