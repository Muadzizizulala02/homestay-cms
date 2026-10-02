import { Component, ElementRef, OnInit, computed, effect, inject, signal, viewChild } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { LoadError } from '../../shared/ui/load-error/load-error';
import { I18nService } from '../../shared/i18n/i18n.service';
import { MediaService, type MediaItem } from '../../shared/services/media.service';

@Component({
  selector: 'app-gallery',
  imports: [LoadError],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryPage implements OnInit {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);
  protected readonly i18n = inject(I18nService);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('viewer');

  readonly items = signal<MediaItem[]>([]);
  readonly loaded = signal(false);
  readonly failed = signal(false);
  readonly activeIndex = signal(0);
  readonly active = computed(() => this.items()[this.activeIndex()] ?? null);

  constructor() {
    effect(() => {
      this.seo.setPage(this.i18n.t('nav.gallery'), this.i18n.t('gallery.seoDescription'));
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.failed.set(false);
    this.mediaService.listPublicGallery().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loaded.set(true);
      },
      error: () => this.failed.set(true),
    });
  }

  open(index: number): void {
    this.activeIndex.set(index);
    this.dialog()?.nativeElement.showModal();
  }

  close(): void {
    this.dialog()?.nativeElement.close();
  }

  step(delta: number): void {
    const total = this.items().length;
    if (total > 0) {
      this.activeIndex.set((this.activeIndex() + delta + total) % total);
    }
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      this.step(1);
    } else if (event.key === 'ArrowLeft') {
      this.step(-1);
    }
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
