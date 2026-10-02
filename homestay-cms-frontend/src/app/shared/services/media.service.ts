import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type MediaAssociation = { type: 'gallery' } | { type: 'accommodation'; accommodationId: string };

export interface MediaItem {
  id: string;
  cloudinaryPublicId: string;
  url: string;
  altText: string;
  association: MediaAssociation;
  order: number;
}

interface SignedUploadParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/media`;

  /** Public — gallery-only items, no auth required. Used by the guest-facing Gallery page. */
  listPublicGallery(): Observable<MediaItem[]> {
    return this.http.get<MediaItem[]>(`${environment.apiUrl}/gallery`);
  }

  list(): Observable<MediaItem[]> {
    return this.http.get<MediaItem[]>(this.baseUrl);
  }

  update(id: string, input: Partial<Pick<MediaItem, 'altText' | 'order' | 'association'>>): Observable<MediaItem> {
    return this.http.put<MediaItem>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Signs, then uploads straight to Cloudinary (never through our own API/interceptor). */
  async uploadRaw(file: File, folder = 'homestay'): Promise<{ publicId: string; url: string }> {
    const params = await firstValueFrom(
      this.http.post<SignedUploadParams>(`${this.baseUrl}/sign-upload`, { folder })
    );

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', String(params.timestamp));
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload to Cloudinary failed (${uploadRes.status})`);
    }

    const uploaded = (await uploadRes.json()) as { public_id: string; secure_url: string };
    return { publicId: uploaded.public_id, url: uploaded.secure_url };
  }

  /** Uploads and records the result as a gallery/accommodation media item. */
  async upload(
    file: File,
    altText: string,
    association: MediaAssociation,
    folder = 'homestay'
  ): Promise<MediaItem> {
    const { publicId, url } = await this.uploadRaw(file, folder);
    return firstValueFrom(
      this.http.post<MediaItem>(this.baseUrl, { cloudinaryPublicId: publicId, url, altText, association })
    );
  }
}
