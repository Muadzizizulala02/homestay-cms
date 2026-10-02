import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { formatStayDate, isIsoDate, nightsBetween } from '../booking/stay-dates';

interface StayParams {
  checkIn: string;
  checkOut: string;
  guests?: number;
}

@Component({
  selector: 'app-accommodation-list',
  imports: [RouterLink],
  templateUrl: './accommodation-list.html',
  styleUrl: './accommodation-list.scss',
})
export class AccommodationListPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);
  readonly i18n = inject(I18nService);

  readonly units = signal<Accommodation[]>([]);
  readonly loaded = signal(false);

  /** Dates/guests sent by the hero booking bar; null unless both dates are valid and in order. */
  readonly stay = signal<StayParams | null>(null);

  readonly featured = computed(() => this.units()[0] ?? null);
  readonly others = computed(() => this.units().slice(1));

  /** Query params carried onto each room link so the next pages are pre-filled. */
  readonly linkParams = computed<Record<string, string | number>>(() => {
    const stay = this.stay();
    if (!stay) {
      return {} as Record<string, string | number>;
    }
    return stay.guests
      ? { checkIn: stay.checkIn, checkOut: stay.checkOut, guests: stay.guests }
      : { checkIn: stay.checkIn, checkOut: stay.checkOut };
  });

  readonly summary = computed(() => {
    const stay = this.stay();
    if (!stay) {
      return '';
    }
    const lang = this.i18n.lang();
    const nights = nightsBetween(stay.checkIn, stay.checkOut);
    const text = this.i18n.t('rooms.summary', {
      checkIn: formatStayDate(stay.checkIn, lang),
      checkOut: formatStayDate(stay.checkOut, lang),
      nights: this.i18n.t('bar.nights', { count: nights }),
      guests: this.i18n.t('rooms.guestsCount', { count: stay.guests ?? 1 }),
    });
    // Guests are optional in the link; drop the trailing segment rather than invent a number.
    return stay.guests ? text : text.replace(/,\s*[^,]*$/, '');
  });

  ngOnInit(): void {
    this.seo.setPage(this.i18n.t('rooms.seoTitle'), this.i18n.t('rooms.seoDescription'));
    this.readStay();
    this.accommodationService.listPublic().subscribe({
      next: (list) => {
        this.units.set(list);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  private readStay(): void {
    const params = this.route.snapshot.queryParamMap;
    const checkIn = params.get('checkIn');
    const checkOut = params.get('checkOut');
    if (!isIsoDate(checkIn) || !isIsoDate(checkOut) || nightsBetween(checkIn, checkOut) === 0) {
      return;
    }
    const guests = Number(params.get('guests'));
    this.stay.set({
      checkIn,
      checkOut,
      guests: Number.isInteger(guests) && guests > 0 ? guests : undefined,
    });
  }
}
