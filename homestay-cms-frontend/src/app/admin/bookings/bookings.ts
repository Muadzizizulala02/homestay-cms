import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AccommodationService } from '../../shared/services/accommodation.service';
import { AdminBookingsService, type AdminBooking } from '../../shared/services/admin-bookings.service';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

type StatusFilter = 'all' | 'pending_payment' | 'confirmed';

@Component({
  selector: 'app-admin-bookings',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './bookings.html',
  styleUrl: './bookings.scss',
})
export class BookingsPage implements OnInit {
  private readonly bookingsService = inject(AdminBookingsService);
  private readonly accommodationService = inject(AccommodationService);
  private readonly snackBar = inject(MatSnackBar);

  readonly bookings = signal<AdminBooking[]>([]);
  readonly accommodationNames = signal<Record<string, string>>({});
  readonly filter = signal<StatusFilter>('all');
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  /** Booking id with an action in flight — disables its buttons to prevent double submits. */
  readonly busyId = signal<string | null>(null);

  readonly visibleBookings = computed(() => {
    const filter = this.filter();
    return filter === 'all' ? this.bookings() : this.bookings().filter((b) => b.status === filter);
  });
  readonly awaitingCount = computed(() => this.bookings().filter((b) => b.status === 'pending_payment').length);

  ngOnInit(): void {
    this.accommodationService.list().subscribe((list) => {
      this.accommodationNames.set(Object.fromEntries(list.map((a) => [a.id, a.name])));
    });
    this.refresh();
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  unitName(booking: AdminBooking): string {
    return this.accommodationNames()[booking.accommodationId] ?? 'Unknown unit';
  }

  canConfirm(booking: AdminBooking): boolean {
    return booking.status === 'pending_payment';
  }

  canCancel(booking: AdminBooking): boolean {
    return (booking.status === 'pending_payment' || booking.status === 'confirmed') && !booking.paidOnline;
  }

  /** Money was taken through the gateway and not yet refunded — including after the booking lapsed. */
  canRefund(booking: AdminBooking): boolean {
    return booking.paidOnline && booking.paymentStatus === 'paid';
  }

  /** The guest paid after the booking expired or was cancelled: their dates may be gone, so refund. */
  needsRefund(booking: AdminBooking): boolean {
    return this.canRefund(booking) && (booking.status === 'expired' || booking.status === 'cancelled');
  }

  setFilter(filter: StatusFilter): void {
    this.filter.set(filter);
  }

  confirm(booking: AdminBooking): void {
    if (!confirm(`Mark ${booking.reference} as paid and confirm it? Only do this once you have received the money.`)) {
      return;
    }
    this.run(booking, this.bookingsService.confirm(booking.id), 'Booking confirmed');
  }

  cancel(booking: AdminBooking): void {
    if (!confirm(`Cancel ${booking.reference}? The dates will become available again.`)) {
      return;
    }
    this.run(booking, this.bookingsService.cancel(booking.id), 'Booking cancelled');
  }

  refund(booking: AdminBooking): void {
    if (
      !confirm(
        `Record ${booking.reference} as refunded and cancel it? This does NOT send money — ` +
          'refund the guest through ToyyibPay first.'
      )
    ) {
      return;
    }
    this.run(booking, this.bookingsService.refund(booking.id), 'Recorded as refunded');
  }

  refresh(): void {
    this.loading.set(true);
    this.bookingsService.list().subscribe({
      next: (list) => {
        this.bookings.set(list);
        this.loadFailed.set(false);
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  private run(booking: AdminBooking, request: ReturnType<AdminBookingsService['confirm']>, success: string): void {
    this.busyId.set(booking.id);
    request.subscribe({
      next: () => {
        this.busyId.set(null);
        this.snackBar.open(success, 'Dismiss', { duration: 3000 });
        this.refresh();
      },
      error: (err) => {
        this.busyId.set(null);
        const message = err?.error?.error?.message ?? 'Something went wrong. Please try again.';
        this.snackBar.open(message, 'Dismiss', { duration: 6000 });
        this.refresh();
      },
    });
  }
}
