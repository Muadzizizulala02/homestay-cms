import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { AccommodationService, type Accommodation } from '../../shared/services/accommodation.service';

@Component({
  selector: 'app-accommodation-list',
  imports: [RouterLink],
  templateUrl: './accommodation-list.html',
  styleUrl: './accommodation-list.scss',
})
export class AccommodationListPage implements OnInit {
  private readonly accommodationService = inject(AccommodationService);
  private readonly seo = inject(SeoService);

  readonly units = signal<Accommodation[]>([]);
  readonly loaded = signal(false);

  ngOnInit(): void {
    this.seo.setPage('Accommodation', 'Browse our rooms and units, with photos, capacity, and pricing.');
    this.accommodationService.listPublic().subscribe((list) => {
      this.units.set(list);
      this.loaded.set(true);
    });
  }
}
