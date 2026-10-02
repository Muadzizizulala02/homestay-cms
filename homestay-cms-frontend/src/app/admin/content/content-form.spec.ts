import { describe, expect, it } from 'vitest';
import { FormBuilder } from '@angular/forms';
import {
  BACKGROUND_SECTIONS,
  OTHER_PLATFORM,
  addSlide,
  createSocialLinkGroup,
  initialSlides,
  isHttpUrl,
  isHttpUrlOrEmpty,
  normalizeBackgrounds,
  withBackground,
  moveSlide,
  nextShareImage,
  platformChoice,
  removeSlide,
  toSocialLinks,
} from './content-form';

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

describe('slide helpers', () => {
  it('adds at the end, ignoring blanks and duplicates', () => {
    expect(addSlide(['a'], ' b ')).toEqual(['a', 'b']);
    expect(addSlide(['a'], 'a')).toEqual(['a']);
    expect(addSlide(['a'], '  ')).toEqual(['a']);
  });

  it('stops at the limit', () => {
    expect(addSlide(['a', 'b'], 'c', 2)).toEqual(['a', 'b']);
  });

  it('removes by index without mutating', () => {
    const slides = ['a', 'b', 'c'];
    expect(removeSlide(slides, 1)).toEqual(['a', 'c']);
    expect(slides).toEqual(['a', 'b', 'c']);
  });

  it('moves up and down, and ignores moves past the ends', () => {
    expect(moveSlide(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveSlide(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveSlide(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
    expect(moveSlide(['a', 'b'], 1, 1)).toEqual(['a', 'b']);
  });

  it('falls back to the single hero image when there is no list', () => {
    expect(initialSlides(['x', 'y'], 'z')).toEqual(['x', 'y']);
    expect(initialSlides([], 'z')).toEqual(['z']);
    expect(initialSlides(undefined, '')).toEqual([]);
  });
});

describe('social links', () => {
  const fb = new FormBuilder().nonNullable;

  it('recognises known platforms case-insensitively and treats others as Other', () => {
    expect(platformChoice('instagram')).toEqual({ choice: 'Instagram', custom: '' });
    expect(platformChoice('Line')).toEqual({ choice: OTHER_PLATFORM, custom: 'Line' });
  });

  it('rejects a non-http address but allows a blank (unsaved) row', () => {
    expect(createSocialLinkGroup(fb, { platform: 'Facebook', url: 'ftp://x' }).controls.url.invalid).toBe(true);
    expect(createSocialLinkGroup(fb, { platform: 'Facebook', url: '' }).valid).toBe(true);
    expect(createSocialLinkGroup(fb, { platform: 'Facebook', url: 'https://facebook.com/a' }).valid).toBe(true);
  });

  it('requires a name when Other is chosen for a filled row', () => {
    const group = createSocialLinkGroup(fb, { platform: '', url: 'https://a.com' });
    expect(group.errors).toEqual({ platformName: true });
    group.controls.customPlatform.setValue('Line');
    expect(group.valid).toBe(true);
  });

  it('drops blank rows and maps Other to its custom name', () => {
    const rows = [
      createSocialLinkGroup(fb, { platform: 'Facebook', url: ' https://facebook.com/a ' }),
      createSocialLinkGroup(fb, { platform: 'Facebook', url: '   ' }),
      createSocialLinkGroup(fb, { platform: 'Line', url: 'https://line.me/x' }),
    ];
    expect(toSocialLinks(rows)).toEqual([
      { platform: 'Facebook', url: 'https://facebook.com/a' },
      { platform: 'Line', url: 'https://line.me/x' },
    ]);
  });
});

describe('section backgrounds', () => {
  const empty = { rooms: '', facilities: '', steps: '', rules: '', about: '' };

  it('fills every section key when nothing is saved', () => {
    expect(normalizeBackgrounds(undefined)).toEqual(empty);
    expect(normalizeBackgrounds({})).toEqual(empty);
  });

  it('trims values and turns non-strings into empty', () => {
    const raw = { steps: ' https://a/1.jpg ', about: 5, rules: null } as never;
    expect(normalizeBackgrounds(raw)).toEqual({ ...empty, steps: 'https://a/1.jpg' });
  });

  it('keeps a rooms photo', () => {
    expect(normalizeBackgrounds({ rooms: 'https://a/rooms.jpg' })).toEqual({ ...empty, rooms: 'https://a/rooms.jpg' });
  });

  it('offers the rooms section first in the admin, matching the page order', () => {
    expect(BACKGROUND_SECTIONS.map((s) => s.key)).toEqual(['rooms', 'facilities', 'steps', 'rules', 'about']);
  });

  it('withBackground returns a changed copy without mutating', () => {
    const before = { ...empty };
    const after = withBackground(before, 'rules', 'https://a/r.jpg');
    expect(after.rules).toBe('https://a/r.jpg');
    expect(before).toEqual(empty);
  });

  it('isHttpUrl requires a non-empty http(s) address', () => {
    expect(isHttpUrl('')).toBe(false);
    expect(isHttpUrl('  ')).toBe(false);
    expect(isHttpUrl('ftp://x')).toBe(false);
    expect(isHttpUrl('https://x/y.jpg')).toBe(true);
  });
});
