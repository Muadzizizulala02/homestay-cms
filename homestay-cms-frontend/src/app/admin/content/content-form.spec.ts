import { describe, expect, it } from 'vitest';
import { isHttpUrlOrEmpty, nextShareImage } from './content-form';

describe('isHttpUrlOrEmpty', () => {
  it('accepts empty (no hero image) and http(s) addresses', () => {
    expect(isHttpUrlOrEmpty('')).toBe(true);
    expect(isHttpUrlOrEmpty('  ')).toBe(true);
    expect(isHttpUrlOrEmpty('https://res.cloudinary.com/demo/image/upload/a.jpg')).toBe(true);
  });

  it('rejects other schemes, bare words and addresses with spaces', () => {
    expect(isHttpUrlOrEmpty('javascript:alert(1)')).toBe(false);
    expect(isHttpUrlOrEmpty('data:image/png;base64,AAAA')).toBe(false);
    expect(isHttpUrlOrEmpty('my photo')).toBe(false);
    expect(isHttpUrlOrEmpty('https://a.com/with space.jpg')).toBe(false);
  });
});

describe('nextShareImage', () => {
  it('follows the hero when the share image mirrored it', () => {
    expect(nextShareImage('https://a/1.jpg', 'https://a/1.jpg', 'https://a/2.jpg')).toBe('https://a/2.jpg');
  });

  it('follows the hero when the share image was empty', () => {
    expect(nextShareImage('', '', 'https://a/2.jpg')).toBe('https://a/2.jpg');
  });

  it('keeps a share image the owner set on purpose', () => {
    expect(nextShareImage('https://a/1.jpg', 'https://a/custom.jpg', 'https://a/2.jpg')).toBe('https://a/custom.jpg');
  });

  it('clears a mirrored share image when the hero is removed', () => {
    expect(nextShareImage('https://a/1.jpg', 'https://a/1.jpg', '')).toBe('');
  });
});
