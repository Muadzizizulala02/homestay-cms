import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../i18n/i18n.service';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MAX_GUESTS = 12;

function toIsoDate(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toIsoDate(new Date(y, m - 1, d + days));
}

/**
 * The hero's date strip. It only gathers check-in, check-out and guest count, then hands off to
 * the rooms page via query params — availability itself is checked per room there.
 */
@Component({
  selector: 'app-booking-bar',
  imports: [FormsModule],
  templateUrl: './booking-bar.html',
  styleUrl: './booking-bar.scss',
})
export class BookingBar {
  protected readonly i18n = inject(I18nService);
  private readonly router = inject(Router);

  readonly today = toIsoDate(new Date());
  readonly guestOptions = Array.from({ length: MAX_GUESTS }, (_, index) => index + 1);

  readonly checkIn = signal('');
  readonly checkOut = signal('');
  readonly guests = signal(2);
  readonly attempted = signal(false);

  readonly minCheckOut = computed(() => (this.checkIn() ? addDays(this.checkIn(), 1) : addDays(this.today, 1)));

  /** Whole nights between the two dates; 0 until both are set and in order. */
  readonly nights = computed(() => {
    if (!this.checkIn() || !this.checkOut()) {
      return 0;
    }
    const diff = Math.round((new Date(this.checkOut()).getTime() - new Date(this.checkIn()).getTime()) / MS_PER_DAY);
    return diff > 0 ? diff : 0;
  });

  readonly datesInvalid = computed(() => !!this.checkIn() && !!this.checkOut() && this.nights() === 0);

  onCheckInChange(value: string): void {
    this.checkIn.set(value);
    // Keep check-out valid when check-in moves past it.
    if (value && (!this.checkOut() || this.checkOut() <= value)) {
      this.checkOut.set(addDays(value, 1));
    }
  }

  submit(): void {
    this.attempted.set(true);
    if (this.datesInvalid()) {
      return;
    }

    const hasDates = !!this.checkIn() && !!this.checkOut();
    void this.router.navigate(['/accommodation'], {
      queryParams: hasDates ? { checkIn: this.checkIn(), checkOut: this.checkOut(), guests: this.guests() } : { guests: this.guests() },
    });
  }
}
