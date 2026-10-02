import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Accommodation, AccommodationInput } from '../../../shared/services/accommodation.service';
import { MediaService } from '../../../shared/services/media.service';

export interface AccommodationDialogData {
  accommodation: Accommodation | null;
}

@Component({
  selector: 'app-accommodation-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './accommodation-form-dialog.html',
  styleUrl: './accommodation-form-dialog.scss',
})
export class AccommodationFormDialog {
  private readonly fb = inject(FormBuilder);
  private readonly mediaService = inject(MediaService);
  private readonly dialogRef = inject(MatDialogRef<AccommodationFormDialog>);
  private readonly data = inject<AccommodationDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.accommodation !== null;
  readonly uploading = signal(false);
  readonly uploadError = signal<string | null>(null);
  readonly photos = signal<string[]>(this.data.accommodation?.photos ?? []);

  readonly form = this.fb.nonNullable.group({
    slug: [this.data.accommodation?.slug ?? '', [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)]],
    name: [this.data.accommodation?.name ?? '', Validators.required],
    description: [this.data.accommodation?.description ?? ''],
    capacity: [this.data.accommodation?.capacity ?? 2, [Validators.required, Validators.min(1)]],
    beds: [this.data.accommodation?.beds ?? 1, [Validators.required, Validators.min(1)]],
    amenities: [(this.data.accommodation?.amenities ?? []).join(', ')],
    basePrice: [this.data.accommodation?.basePrice ?? 0, [Validators.required, Validators.min(1)]],
    minStay: [this.data.accommodation?.minStay ?? 1, [Validators.required, Validators.min(1)]],
    maxStay: [this.data.accommodation?.maxStay ?? 30, [Validators.required, Validators.min(1)]],
    active: [this.data.accommodation?.active ?? true],
  });

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading.set(true);
    this.uploadError.set(null);

    try {
      const { url } = await this.mediaService.uploadRaw(file, 'accommodations');
      this.photos.update((current) => [...current, url]);
    } catch {
      this.uploadError.set('Photo upload failed. Check the Cloudinary configuration and try again.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  removePhoto(url: string): void {
    this.photos.update((current) => current.filter((p) => p !== url));
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const input: AccommodationInput = {
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      photos: this.photos(),
      capacity: raw.capacity,
      beds: raw.beds,
      amenities: raw.amenities
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean),
      basePrice: raw.basePrice,
      minStay: raw.minStay,
      maxStay: raw.maxStay,
      active: raw.active,
    };

    this.dialogRef.close(input);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
