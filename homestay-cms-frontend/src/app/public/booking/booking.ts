import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../core/seo.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';
import { BookingService, type Booking } from '../../shared/services/booking.service';

type Step = 'dates' | 'guest' | 'review' | 'confirmation';

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

  readonly unit = signal<Accommodation | null>(null);
  readonly notFound = signal(false);
  readonly step = signal<Step>('dates');

  readonly checkInDate = signal('');
  readonly checkOutDate = signal('');
  readonly guestCount = signal(1);
  readonly availabilityError = signal<string | null>(null);
  readonly checkingAvailability = signal(false);

  readonly guestName = signal('');
  readonly guestEmail = signal('');
  readonly guestPhone = signal('');
  readonly guestNotes = signal('');

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmedBooking = signal<Booking | null>(null);

  readonly nights = computed(() => {
    if (!this.checkInDate() || !this.checkOutDate()) {
      return 0;
    }
    const diffMs = new Date(this.checkOutDate()).getTime() - new Date(this.checkInDate()).getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  });

  readonly guestDetailsValid = computed(
    () => this.guestName().trim().length > 0 && this.guestEmail().trim().length > 0 && this.guestPhone().trim().length > 0
  );

  ngOnInit(): void {
    this.seo.setPage('Book your stay', 'Complete your booking.');
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
      this.availabilityError.set('Please choose both a check-in and check-out date.');
      return;
    }

    if (this.nights() < unit.minStay) {
      this.availabilityError.set(`Minimum stay is ${unit.minStay} night(s).`);
      return;
    }
    if (this.nights() > unit.maxStay) {
      this.availabilityError.set(`Maximum stay is ${unit.maxStay} night(s).`);
      return;
    }
    if (this.guestCount() < 1 || this.guestCount() > unit.capacity) {
      this.availabilityError.set(`Guest count must be between 1 and ${unit.capacity}.`);
      return;
    }

    this.checkingAvailability.set(true);
    this.availabilityError.set(null);

    this.bookingService.getAvailability(unit.id, this.checkInDate(), this.checkOutDate()).subscribe({
      next: (taken) => {
        this.checkingAvailability.set(false);
        if (Object.keys(taken).length > 0) {
          this.availabilityError.set(
            'Some of the selected dates are already booked. Please choose different dates.'
          );
          return;
        }
        this.step.set('guest');
      },
      error: () => {
        this.checkingAvailability.set(false);
        this.availabilityError.set('Could not check availability. Please try again.');
      },
    });
  }

  goToReview(): void {
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
          this.submitting.set(false);
          this.confirmedBooking.set(booking);
          this.step.set('confirmation');
        },
        error: (err) => {
          this.submitting.set(false);
          const code = err?.error?.error?.code;
          this.submitError.set(
            code === 'DATES_UNAVAILABLE'
              ? 'Those dates were just booked by someone else. Please go back and choose different dates.'
              : 'Could not complete your booking. Please try again.'
          );
        },
      });
  }
}
