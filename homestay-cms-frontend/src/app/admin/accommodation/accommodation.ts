import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  AccommodationService,
  type Accommodation,
} from '../../shared/services/accommodation.service';
import {
  AccommodationFormDialog,
  type AccommodationDialogData,
} from './accommodation-form-dialog/accommodation-form-dialog';

@Component({
  selector: 'app-admin-accommodation',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './accommodation.html',
  styleUrl: './accommodation.scss',
})
export class AccommodationPage implements OnInit {
  private readonly accommodationService = inject(AccommodationService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly accommodations = signal<Accommodation[]>([]);
  readonly columns = ['name', 'capacity', 'basePrice', 'active', 'actions'];

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.accommodationService.list().subscribe((list) => this.accommodations.set(list));
  }

  openCreateDialog(): void {
    this.openDialog(null);
  }

  openEditDialog(accommodation: Accommodation): void {
    this.openDialog(accommodation);
  }

  private openDialog(accommodation: Accommodation | null): void {
    const ref = this.dialog.open<AccommodationFormDialog, AccommodationDialogData>(AccommodationFormDialog, {
      data: { accommodation },
    });

    ref.afterClosed().subscribe((input) => {
      if (!input) {
        return;
      }

      const request = accommodation
        ? this.accommodationService.update(accommodation.id, input)
        : this.accommodationService.create(input);

      request.subscribe({
        next: () => {
          this.snackBar.open(accommodation ? 'Accommodation updated' : 'Accommodation created', 'Dismiss', {
            duration: 3000,
          });
          this.refresh();
        },
        error: () => this.snackBar.open('Something went wrong. Please try again.', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  deleteAccommodation(accommodation: Accommodation): void {
    if (!confirm(`Delete "${accommodation.name}"? This cannot be undone.`)) {
      return;
    }

    this.accommodationService.delete(accommodation.id).subscribe({
      next: () => {
        this.snackBar.open('Accommodation deleted', 'Dismiss', { duration: 3000 });
        this.refresh();
      },
      error: (err) => {
        const message =
          err?.error?.error?.code === 'ACCOMMODATION_HAS_BOOKINGS'
            ? 'This accommodation has existing bookings — deactivate it instead of deleting it.'
            : 'Could not delete this accommodation.';
        this.snackBar.open(message, 'Dismiss', { duration: 5000 });
      },
    });
  }
}
