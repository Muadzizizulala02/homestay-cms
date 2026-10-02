import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { I18nService } from '../../i18n/i18n.service';
import type { LocalizedNotice } from '../../i18n/localize';
import { SiteContentService } from '../../services/site-content.service';

const SEEN_KEY = 'homestay.notices.seen';

function readSeen(): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return []; // storage blocked or corrupt: show everything rather than hide a notice
  }
}

function writeSeen(ids: string[]): void {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // Not persisted; the notice just shows again on the next page load.
  }
}

/**
 * Admin-managed announcements. Ordinary notices sit in a slim strip under the header; "important"
 * ones also open once per browser session in a modal. Dismissals live in sessionStorage so a
 * visitor is not nagged on every page, but a new visit shows them again.
 */
@Component({
  selector: 'app-notices',
  templateUrl: './notices.html',
  styleUrl: './notices.scss',
})
export class Notices {
  protected readonly i18n = inject(I18nService);
  private readonly siteContent = inject(SiteContentService);

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');
  private readonly seen = signal<string[]>(readSeen());
  private readonly dismissedStrip = signal<string[]>([]);

  private readonly all = computed(() => this.siteContent.content()?.notices ?? []);

  readonly stripNotices = computed(() =>
    this.all().filter((notice) => !this.dismissedStrip().includes(notice.id))
  );

  /** Important notices this visitor has not already closed during this session. */
  readonly popupNotices = computed(() =>
    this.all().filter((notice) => notice.important && !this.seen().includes(notice.id))
  );

  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (dialog && this.popupNotices().length > 0 && !dialog.open) {
        dialog.showModal();
      }
    });
  }

  dismissStrip(notice: LocalizedNotice): void {
    this.dismissedStrip.update((ids) => [...ids, notice.id]);
  }

  closePopup(): void {
    const ids = [...this.seen(), ...this.popupNotices().map((notice) => notice.id)];
    this.seen.set(ids);
    writeSeen(ids);
    this.dialog()?.nativeElement.close();
  }
}
