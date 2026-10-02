import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';

@Component({
  selector: 'app-accommodation-detail',
  imports: [RouterLink, FormsModule],
  templateUrl: './accommodation-detail.html',
  styleUrl: './accommodation-detail.scss',
})
export class AccommodationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly unit = signal<Accommodation | null>(null);
  readonly notFound = signal(false);

  readonly checkInDate = signal('');
  readonly checkOutDate = signal('');
  readonly guestCount = signal(1);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.accommodationService.getPublicBySlug(slug).subscribe({
      next: (unit) => {
        this.unit.set(unit);
        this.guestCount.set(Math.min(this.guestCount(), unit.capacity));
        this.seo.setPage(unit.name, unit.description.slice(0, 160));
      },
      error: () => this.notFound.set(true),
    });
  }

  goToBooking(): void {
    const unit = this.unit();
    if (!unit) {
      return;
    }
    this.router.navigate(['/booking'], {
      queryParams: {
        unit: unit.slug,
        checkIn: this.checkInDate(),
        checkOut: this.checkOutDate(),
        guests: this.guestCount(),
      },
    });
  }
}
