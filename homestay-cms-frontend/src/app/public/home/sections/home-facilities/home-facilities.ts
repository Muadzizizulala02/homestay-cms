import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import type { LocalizedFacility } from '../../../../shared/i18n/localize';
import { cssUrl } from '../../../../shared/ui/css-url';
import { Reveal } from '../../../../shared/ui/reveal/reveal';

/**
 * "What you can count on": a light band with the heading on the left and the facilities as icon
 * tiles on the right. A tile flips to dark ink with a gold icon on hover.
 */
@Component({
  selector: 'app-home-facilities',
  imports: [MatIconModule, Reveal],
  templateUrl: './home-facilities.html',
  styleUrl: './home-facilities.scss',
})
export class HomeFacilities {
  protected readonly i18n = inject(I18nService);
  readonly facilities = input.required<LocalizedFacility[]>();
  /** Optional photo behind the band; empty keeps the default light design. */
  readonly background = input('');
  protected readonly image = computed(() => cssUrl(this.background()));
  /** A small mosaic of squares (a nod to patterned shophouse floor tiles); a few are highlighted. */
  protected readonly motif = Array.from({ length: 8 }, (_, index) => index);
}
