import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { MediaService, type MediaItem } from '../../shared/services/media.service';

@Component({
  selector: 'app-admin-media',
  imports: [
    RouterLink,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
  ],
  templateUrl: './media.html',
  styleUrl: './media.scss',
})
export class MediaPage implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly snackBar = inject(MatSnackBar);

  readonly items = signal<MediaItem[]>([]);
  readonly uploading = signal(false);
  readonly pendingAltText = signal('');

  ngOnInit(): void {
    this.refresh();
  }

  private refresh(): void {
    this.mediaService.list().subscribe((items) => this.items.set(items));
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.uploading.set(true);
    try {
      await this.mediaService.upload(file, this.pendingAltText() || file.name, { type: 'gallery' });
      this.pendingAltText.set('');
      this.refresh();
    } catch {
      this.snackBar.open('Upload failed. Check the Cloudinary configuration and try again.', 'Dismiss', {
        duration: 5000,
      });
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  updateAltText(item: MediaItem, altText: string): void {
    if (altText === item.altText) {
      return;
    }
    this.mediaService.update(item.id, { altText }).subscribe(() => this.refresh());
  }

  deleteItem(item: MediaItem): void {
    if (!confirm('Delete this photo? This removes it from Cloudinary too.')) {
      return;
    }
    this.mediaService.delete(item.id).subscribe(() => this.refresh());
  }
}
