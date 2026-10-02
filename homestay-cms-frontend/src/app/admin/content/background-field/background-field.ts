import { Component, inject, input, model, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MediaService, type MediaItem } from '../../../shared/services/media.service';
import { isHttpUrl } from '../content-form';

/** Picks an optional background photo for one home page section: upload, gallery or address. */
@Component({
  selector: 'app-background-field',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './background-field.html',
  styleUrl: './background-field.scss',
})
export class BackgroundField {
  private readonly mediaService = inject(MediaService);
  private readonly snackBar = inject(MatSnackBar);

  readonly label = input.required<string>();
  readonly hint = input('');
  readonly gallery = input<MediaItem[]>([]);
  readonly value = model('');

  readonly uploading = signal(false);
  readonly addressError = signal(false);
  readonly address = new FormControl('', { nonNullable: true });

  choose(url: string): void {
    this.value.set(url);
  }

  remove(): void {
    this.value.set('');
  }

  setAddress(): void {
    const url = this.address.value.trim();
    if (!isHttpUrl(url)) {
      // mat-error only shows for a control in an error state, so put the control into one.
      this.address.setErrors({ url: true });
      this.address.markAsTouched();
      this.addressError.set(true);
      return;
    }
    this.addressError.set(false);
    this.value.set(url);
    this.address.setValue('');
  }

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.uploading()) {
      return;
    }
    this.uploading.set(true);
    try {
      const { url } = await this.mediaService.uploadRaw(file, 'homestay/backgrounds');
      this.value.set(url);
    } catch {
      this.snackBar.open(`Could not upload ${file.name}`, 'Dismiss', { duration: 5000 });
    } finally {
      this.uploading.set(false);
    }
  }
}
