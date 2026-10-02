import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../../shared/i18n/i18n.service';
import { Reveal } from '../../../../shared/ui/reveal/reveal';

/**
 * "How booking works": a journey of four numbered nodes joined by a line that draws itself gold
 * between them as the section scrolls into view, ending in a call to action. Horizontal on wide
 * screens, a vertical timeline on phones.
 */
@Component({
  selector: 'app-home-steps',
  imports: [RouterLink, Reveal],
  templateUrl: './home-steps.html',
  styleUrl: './home-steps.scss',
})
export class HomeSteps {
  protected readonly i18n = inject(I18nService);
  protected readonly steps = [1, 2, 3, 4];
}
