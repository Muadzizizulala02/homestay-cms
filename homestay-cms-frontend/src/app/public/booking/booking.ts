import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { isPlausibleEmail } from './guest-validation';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { BookingService, type Booking } from '../../shared/services/booking.service';
import { I18nService } from '../../shared/i18n/i18n.service';
import { formatStayDate, nightsBetween } from './stay-dates';

type Step = 'dates' | 'guest' | 'review' | 'confirmation';

/** An error shown to the guest: a translation key plus its parameters, so it follows the language switch. */
interface FormError {
  key: string;
  count?: number;
}

@Component({
  selector: 'app-booking',
  imports: [FormsModule, RouterLink],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class BookingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly accommodationService = inject(AccommodationService);
  private readonly bookingService = inject(BookingService);
  private readonly seo = inject(SeoService);
  readonly i18n = inject(I18nService);

  readonly unit = signal<Accommodation | null>(null);
  readonly notFound = signal(false);
  readonly step = signal<Step>('dates');

  readonly checkInDate = signal('');
  readonly checkOutDate = signal('');
  readonly guestCount = signal(1);
  readonly availabilityError = signal<FormError | null>(null);
  readonly checkingAvailability = signal(false);

  readonly guestName = signal('');
  readonly guestEmail = signal('');
  readonly guestPhone = signal('');
  readonly guestNotes = signal('');

  readonly submitting = signal(false);
  /** True once the payment call has failed or payment is switched off — shows the 'being set up' notice. */
  readonly paymentUnavailable = signal(false);
  readonly submitError = signal<FormError | null>(null);
  /** Set once the guest has tried to continue, so field errors don't appear while they are still typing. */
  readonly guestAttempted = signal(false);
  readonly confirmedBooking = signal<Booking | null>(null);

  readonly nights = computed(() => nightsBetween(this.checkInDate(), this.checkOutDate()));

  readonly stepIndex = computed(() => {
    const step = this.step();
    return step === 'dates' ? 0 : step === 'guest' ? 1 : 2;
  });

  readonly stepLabels = ['booking.step.dates', 'booking.step.guest', 'booking.step.confirm'];

  readonly datesLabel = computed(() => {
    const lang = this.i18n.lang();
    return `${formatStayDate(this.checkInDate(), lang, true)} – ${formatStayDate(this.checkOutDate(), lang, true)}`;
  });

  readonly confirmedDatesLabel = computed(() => {
    const booking = this.confirmedBooking();
    if (!booking) {
      return '';
    }
    const lang = this.i18n.lang();
    return `${formatStayDate(booking.checkInDate, lang, true)} – ${formatStayDate(booking.checkOutDate, lang, true)}`;
  });

  readonly guestEmailValid = computed(() => isPlausibleEmail(this.guestEmail()));

  readonly guestDetailsValid = computed(
    () => this.guestName().trim().length > 0 && this.guestEmailValid() && this.guestPhone().trim().length > 0
  );

  constructor() {
    effect(() => {
      this.seo.setPage(this.i18n.t('booking.seoTitle'), this.i18n.t('booking.seoDescription'));
    });
  }

  ngOnInit(): void {
    this.seo.setNoIndex();

    const slug = this.route.snapshot.queryParamMap.get('unit');
    if (!slug) {
      this.notFound.set(true);
      return;
    }

    this.checkInDate.set(this.route.snapshot.queryParamMap.get('checkIn') ?? '');
    this.checkOutDate.set(this.route.snapshot.queryParamMap.get('checkOut') ?? '');
    this.guestCount.set(Number(this.route.snapshot.queryParamMap.get('guests')) || 1);

    this.accommodationService.getPublicBySlug(slug).subscribe({
      next: (unit) => this.unit.set(unit),
      error: () => this.notFound.set(true),
    });
  }

  checkAvailabilityAndContinue(): void {
    const unit = this.unit();
    if (!unit || !this.checkInDate() || !this.checkOutDate()) {
      this.availabilityError.set({ key: 'booking.err.dates' });
      return;
    }

    if (this.nights() === 0) {
      this.availabilityError.set({ key: 'booking.err.order' });
      return;
    }
    if (this.nights() < unit.minStay) {
      this.availabilityError.set({ key: 'booking.err.min', count: unit.minStay });
      return;
    }
    if (this.nights() > unit.maxStay) {
      this.availabilityError.set({ key: 'booking.err.max', count: unit.maxStay });
      return;
    }
    if (this.guestCount() < 1 || this.guestCount() > unit.capacity) {
      this.availabilityError.set({ key: 'booking.err.guests', count: unit.capacity });
      return;
    }

    this.checkingAvailability.set(true);
    this.availabilityError.set(null);

    this.bookingService.getAvailability(unit.id, this.checkInDate(), this.checkOutDate()).subscribe({
      next: (taken) => {
        this.checkingAvailability.set(false);
        if (Object.keys(taken).length > 0) {
          this.availabilityError.set({ key: 'booking.err.taken' });
          return;
        }
        this.step.set('guest');
      },
      error: () => {
        this.checkingAvailability.set(false);
        this.availabilityError.set({ key: 'booking.err.availability' });
      },
    });
  }

  goToReview(): void {
    this.guestAttempted.set(true);
    if (this.guestDetailsValid()) {
      this.step.set('review');
    }
  }

  backToDates(): void {
    this.step.set('dates');
  }

  backToGuestDetails(): void {
    this.step.set('guest');
  }

  confirmBooking(): void {
    const unit = this.unit();
    if (!unit) {
      return;
    }

    this.submitting.set(true);
    this.submitError.set(null);

    this.bookingService
      .create({
        accommodationId: unit.id,
        checkInDate: this.checkInDate(),
        checkOutDate: this.checkOutDate(),
        guestCount: this.guestCount(),
        guest: {
          name: this.guestName(),
          email: this.guestEmail(),
          phone: this.guestPhone(),
          notes: this.guestNotes() || undefined,
        },
      })
      .subscribe({
        next: (booking) => {
          this.confirmedBooking.set(booking);
          this.step.set('confirmation');

          // Best-effort: if ToyyibPay isn't configured yet, or the gateway call fails, the guest
          // still has a valid pending_payment booking — just without an online payment option
          // right now. Never block the confirmation on this.
          this.bookingService.createPayment(booking.id).subscribe({
            next: ({ redirectUrl }) => {
              window.location.href = redirectUrl;
            },
            error: () => {
              this.submitting.set(false);
              this.paymentUnavailable.set(true);
            },
          });
        },
        error: (err) => {
          this.submitting.set(false);
          const code = err?.error?.error?.code;
          this.submitError.set({ key: code === 'DATES_UNAVAILABLE' ? 'booking.err.unavailable' : 'booking.err.submit' });
        },
      });
  }
}
