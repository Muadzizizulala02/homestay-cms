import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { cssUrl } from '../css-url';
import { Reveal } from '../reveal/reveal';
import { splitIntoCards, type PolicyItem } from './policy-parse';

/**
 * A full-width policy section: a dark photo background with a centred eyebrow, title, subtitle and
 * quote, then rounded cards holding items (a ringed icon, a heading and a short description).
 * Used for the Privacy and Terms pages and for the house rules.
 *
 *   <app-policy-showcase eyebrow="Our policy" title="Privacy policy" [items]="items" [background]="photoUrl" />
 */
@Component({
  selector: 'app-policy-showcase',
  imports: [MatIconModule, Reveal],
  templateUrl: './policy-showcase.html',
  styleUrl: './policy-showcase.scss',
})
export class PolicyShowcase {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly quote = input('');
  readonly items = input<PolicyItem[]>([]);
  /** Photo behind the section; empty gives a plain dark background. */
  readonly background = input('');
  /** True when this is the page's main heading (an h1); otherwise it is an h2. */
  readonly pageTitle = input(false);
  /** True to sit flush against the sections above (no gap), e.g. between bands on the home page. */
  readonly flush = input(false);

  protected readonly cards = computed(() => splitIntoCards(this.items()));
  protected readonly backgroundImage = computed(() => cssUrl(this.background()));
}
