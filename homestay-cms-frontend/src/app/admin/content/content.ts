import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SiteSettingsService, type SiteSettings } from '../../shared/services/site-settings.service';

@Component({
  selector: 'app-admin-content',
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
  ],
  templateUrl: './content.html',
  styleUrl: './content.scss',
})
export class ContentPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly snackBar = inject(MatSnackBar);

  readonly loaded = signal(false);

  readonly form = this.fb.nonNullable.group({
    heroHeadline: ['', Validators.required],
    heroSubheadline: [''],
    aboutContent: [''],
    hostIntro: [''],
    address: [''],
    contactEmail: ['', Validators.email],
    contactPhone: [''],
    checkInTime: [''],
    checkOutTime: [''],
    cancellationPolicy: [''],
    houseRules: this.fb.array<string>([]),
    faqs: this.fb.array<ReturnType<ContentPage['createFaqGroup']>>([]),
  });

  get houseRules(): FormArray {
    return this.form.controls.houseRules;
  }

  get faqs(): FormArray {
    return this.form.controls.faqs;
  }

  ngOnInit(): void {
    this.siteSettingsService.getForAdmin().subscribe((settings) => {
      this.patchForm(settings);
      this.loaded.set(true);
    });
  }

  private createFaqGroup(question = '', answer = '') {
    return this.fb.nonNullable.group({
      question: [question, Validators.required],
      answer: [answer, Validators.required],
    });
  }

  private patchForm(settings: SiteSettings): void {
    this.form.patchValue({
      heroHeadline: settings.heroHeadline,
      heroSubheadline: settings.heroSubheadline,
      aboutContent: settings.aboutContent,
      hostIntro: settings.hostIntro,
      address: settings.address,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      checkInTime: settings.checkInTime,
      checkOutTime: settings.checkOutTime,
      cancellationPolicy: settings.cancellationPolicy,
    });

    this.houseRules.clear();
    for (const rule of settings.houseRules) {
      this.houseRules.push(this.fb.nonNullable.control(rule, Validators.required));
    }

    this.faqs.clear();
    for (const faq of settings.faqs) {
      this.faqs.push(this.createFaqGroup(faq.question, faq.answer));
    }
  }

  addHouseRule(): void {
    this.houseRules.push(this.fb.nonNullable.control('', Validators.required));
  }

  removeHouseRule(index: number): void {
    this.houseRules.removeAt(index);
  }

  addFaq(): void {
    this.faqs.push(this.createFaqGroup());
  }

  removeFaq(index: number): void {
    this.faqs.removeAt(index);
  }

  save(): void {
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    this.siteSettingsService
      .update({
        ...raw,
        houseRules: raw.houseRules.filter((rule): rule is string => rule !== null),
        faqs: raw.faqs.map((faq, index) => ({ ...faq, order: index })),
      })
      .subscribe({
        next: () => this.snackBar.open('Site content saved', 'Dismiss', { duration: 3000 }),
        error: () => this.snackBar.open('Could not save changes. Please try again.', 'Dismiss', { duration: 4000 }),
      });
  }
}
