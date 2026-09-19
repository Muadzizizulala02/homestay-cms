import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    utils: { api_sign_request: vi.fn(() => 'fake-signature') },
    uploader: { destroy: vi.fn().mockResolvedValue({ result: 'ok' }) },
  },
}));

import { v2 as cloudinary } from 'cloudinary';
import {
  createSignedUploadParams,
  deleteMediaItem,
  listMedia,
  recordMediaItem,
  updateMediaItem,
} from '../media.service';
import { AppError } from '../../utils/app-error';

const REQUIRED_ENV = {
  CLOUDINARY_CLOUD_NAME: 'demo-cloud',
  CLOUDINARY_API_KEY: 'demo-key',
  CLOUDINARY_API_SECRET: 'demo-secret',
};

describe('media.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(process.env, REQUIRED_ENV);
  });

  it('throws a clear error when Cloudinary env vars are missing', () => {
    delete process.env.CLOUDINARY_CLOUD_NAME;
    expect(() => createSignedUploadParams()).toThrow(/CLOUDINARY_CLOUD_NAME/);
  });

  it('signs upload params without exposing the API secret in the response', () => {
    const params = createSignedUploadParams('gallery');
    expect(params).toEqual({
      timestamp: expect.any(Number),
      signature: 'fake-signature',
      apiKey: 'demo-key',
      cloudName: 'demo-cloud',
      folder: 'gallery',
    });
    expect(JSON.stringify(params)).not.toContain('demo-secret');
  });

  it('records, lists, updates, and deletes a media item', async () => {
    const recorded = await recordMediaItem({
      cloudinaryPublicId: `test-${Date.now()}`,
      url: 'https://res.cloudinary.com/demo-cloud/image/upload/test.jpg',
      altText: 'A garden room',
      association: { type: 'gallery' },
    });
    expect(recorded.id).toBeTruthy();
    expect(recorded.order).toBeGreaterThanOrEqual(0);

    const all = await listMedia();
    expect(all.some((item) => item.id === recorded.id)).toBe(true);

    const updated = await updateMediaItem(recorded.id, { altText: 'Updated caption' });
    expect(updated.altText).toBe('Updated caption');

    await deleteMediaItem(recorded.id);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(recorded.cloudinaryPublicId);

    await expect(updateMediaItem(recorded.id, { altText: 'gone' })).rejects.toThrow(AppError);
  });

  it('404s when deleting an unknown media item', async () => {
    await expect(deleteMediaItem('does-not-exist')).rejects.toThrow(AppError);
  });
});
