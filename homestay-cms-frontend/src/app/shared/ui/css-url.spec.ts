import { describe, expect, it } from 'vitest';
import { cssUrl } from './css-url';

describe('cssUrl', () => {
  it('wraps an address in url("...")', () => {
    expect(cssUrl('https://example.com/a.jpg')).toBe('url("https://example.com/a.jpg")');
  });

  it('returns null for nothing', () => {
    expect(cssUrl('')).toBeNull();
    expect(cssUrl('   ')).toBeNull();
    expect(cssUrl(undefined)).toBeNull();
    expect(cssUrl(null)).toBeNull();
  });

  it('cannot be broken out of with quotes, backslashes or line breaks', () => {
    const nasty = 'https://a.example/x.jpg"); background: red; /*';
    const out = cssUrl(nasty) as string;
    expect(out.startsWith('url("')).toBe(true);
    expect(out.endsWith('")')).toBe(true);
    expect(out.slice(5, -2)).not.toContain('"');
    expect(cssUrl('https://a.example/x\\y.jpg') as string).not.toContain('\\');
    expect(cssUrl('https://a.example/x\n.jpg') as string).not.toContain('\n');
  });
});
