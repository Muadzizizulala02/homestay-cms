import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { ImgFade } from '../../../../shared/ui/img-fade/img-fade';
import { Reveal } from '../../../../shared/ui/reveal/reveal';
import { splitLead } from '../about-text';

/**
 * "About the stay": an editorial layout. A large lead sentence with a gold rule, the rest of the
 * text beneath, the host's note as a speech card, and a framed photo with an offset gold block.
 */
@Component({
  selector: 'app-home-about',
  imports: [RouterLink, MatIconModule, ImgFade, Reveal],
  templateUrl: './home-about.html',
  styleUrl: './home-about.scss',
})
export class HomeAbout {
  protected readonly i18n = inject(I18nService);

  readonly about = input.required<string>();
  readonly hostIntro = input('');
  /** Photo for the frame; empty hides the frame and the text takes the full width. */
  readonly photo = input('');

  protected readonly parts = computed(() => splitLead(this.about()));
}
