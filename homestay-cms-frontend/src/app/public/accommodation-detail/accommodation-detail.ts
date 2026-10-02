import { Skeleton } from '../../shared/ui/skeleton/skeleton';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { localizeDescription } from '../../shared/i18n/localize';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { isIsoDate, nightsBetween } from '../booking/stay-dates';

interface FormError {
  key: string;
  count?: number;
}

@Component({
  selector: 'app-accommodation-detail',
  imports: [RouterLink, FormsModule, Skeleton],
  templateUrl: './accommodation-detail.html',
  styleUrl: './accommodation-detail.scss',
})
export class AccommodationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);
  readonly i18n = inject(I18nService);

  protected readonly thumbs = [0, 1, 2, 3];
  readonly unit = signal<Accommodation | null>(null);
  readonly notFound = signal(false);

  readonly checkInDate = signal('');
  readonly checkOutDate = signal('');
  readonly guestCount = signal(1);
  readonly formError = signal<FormError | null>(null);
  readonly activePhoto = signal(0);

  readonly nights = computed(() => nightsBetween(this.checkInDate(), this.checkOutDate()));
  readonly description = computed(() => {
    const unit = this.unit();
    return unit ? localizeDescription(unit, this.i18n.lang()) : '';
  });

  constructor() {
    effect(() => {
      const unit = this.unit();
      if (unit) {
        this.seo.setPage(unit.name, this.description().slice(0, 160));
      }
    });
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.prefillFromQuery();

    this.accommodationService.getPublicBySlug(slug).subscribe({
      next: (unit) => {
        this.unit.set(unit);
        this.guestCount.set(Math.min(this.guestCount(), unit.capacity));
      },
      error: () => this.notFound.set(true),
    });
  }

  selectPhoto(index: number): void {
    this.activePhoto.set(index);
  }

  goToBooking(): void {
    const unit = this.unit();
    if (!unit) {
      return;
    }
    const error = this.validate(unit);
    this.formError.set(error);
    if (error) {
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

  private validate(unit: Accommodation): FormError | null {
    if (!this.checkInDate() || !this.checkOutDate()) {
      return { key: 'rooms.err.dates' };
    }
    const nights = this.nights();
    if (nights === 0) {
      return { key: 'rooms.err.order' };
    }
    if (nights < unit.minStay) {
      return { key: 'rooms.err.min', count: unit.minStay };
    }
    if (nights > unit.maxStay) {
      return { key: 'rooms.err.max', count: unit.maxStay };
    }
    const guests = Number(this.guestCount());
    if (!Number.isInteger(guests) || guests < 1 || guests > unit.capacity) {
      return { key: 'rooms.err.guests', count: unit.capacity };
    }
    return null;
  }

  private prefillFromQuery(): void {
    const params = this.route.snapshot.queryParamMap;
    const checkIn = params.get('checkIn');
    const checkOut = params.get('checkOut');
    if (isIsoDate(checkIn)) {
      this.checkInDate.set(checkIn);
    }
    if (isIsoDate(checkOut)) {
      this.checkOutDate.set(checkOut);
    }
    const guests = Number(params.get('guests'));
    if (Number.isInteger(guests) && guests > 0) {
      this.guestCount.set(guests);
    }
  }
}
