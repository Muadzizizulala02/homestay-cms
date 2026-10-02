import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { I18nService } from '../../shared/i18n/i18n.service';
import { SiteContentService } from '../../shared/services/site-content.service';
import { Notices } from '../../shared/ui/notices/notices';

@Component({
  selector: 'app-public-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Notices],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.scss',
})
export class PublicLayout implements OnInit {
  protected readonly i18n = inject(I18nService);
  private readonly siteContent = inject(SiteContentService);

  readonly content = this.siteContent.content;
  readonly menuOpen = signal(false);
  readonly currentYear = new Date().getFullYear();

  readonly navLinks = [
    { path: '/', labelKey: 'nav.home' },
    { path: '/accommodation', labelKey: 'nav.rooms' },
    { path: '/gallery', labelKey: 'nav.gallery' },
    { path: '/about', labelKey: 'nav.about' },
    { path: '/faq', labelKey: 'nav.faq' },
    { path: '/contact', labelKey: 'nav.contact' },
  ];

  ngOnInit(): void {
    this.siteContent.ensureLoaded();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
