import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAllowedOrigins, isOriginAllowed } from '../cors';

const KEYS = ['ALLOWED_ORIGINS', 'FRONTEND_BASE_URL', 'FUNCTIONS_EMULATOR'] as const;

describe('CORS origin allow-list', () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      if (saved[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = saved[key];
      }
    }
  });

  it('allows the configured frontend origin, ignoring a trailing slash', () => {
    process.env['FRONTEND_BASE_URL'] = 'https://stay.example.com/';
    expect(isOriginAllowed('https://stay.example.com')).toBe(true);
  });

  it('rejects any other browser origin', () => {
    process.env['FRONTEND_BASE_URL'] = 'https://stay.example.com';
    expect(isOriginAllowed('https://evil.example.net')).toBe(false);
  });

  it('prefers ALLOWED_ORIGINS and supports several origins', () => {
    process.env['FRONTEND_BASE_URL'] = 'https://ignored.example.com';
    process.env['ALLOWED_ORIGINS'] = 'https://a.example.com, https://b.example.com';
    expect(getAllowedOrigins()).toEqual(['https://a.example.com', 'https://b.example.com']);
    expect(isOriginAllowed('https://b.example.com')).toBe(true);
    expect(isOriginAllowed('https://ignored.example.com')).toBe(false);
  });

  it('allows requests with no Origin header (server-to-server callers)', () => {
    process.env['FRONTEND_BASE_URL'] = 'https://stay.example.com';
    expect(isOriginAllowed(undefined)).toBe(true);
  });

  it('rejects every browser origin when nothing is configured', () => {
    expect(isOriginAllowed('https://stay.example.com')).toBe(false);
  });

  it('allows everything under the local emulator', () => {
    process.env['FUNCTIONS_EMULATOR'] = 'true';
    expect(isOriginAllowed('http://localhost:4200')).toBe(true);
  });
});
