import { Component, OnInit, inject, signal } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { MediaService, type MediaItem } from '../../shared/services/media.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryPage implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);

  readonly items = signal<MediaItem[]>([]);
  readonly loaded = signal(false);

  ngOnInit(): void {
    this.seo.setPage('Gallery', 'Photos of the homestay and its surroundings.');
    this.mediaService.listPublicGallery().subscribe((items) => {
      this.items.set(items);
      this.loaded.set(true);
    });
  }
}
