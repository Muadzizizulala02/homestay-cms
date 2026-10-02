import { describe, expect, it } from 'vitest';
import { isPlausibleEmail } from './guest-validation';

describe('isPlausibleEmail', () => {
  it('accepts ordinary addresses, ignoring surrounding spaces', () => {
    expect(isPlausibleEmail('ali@example.com')).toBe(true);
    expect(isPlausibleEmail('  siti.nur+stay@mail.example.com.my ')).toBe(true);
  });

  it('rejects the typos that previously only failed at the server', () => {
    expect(isPlausibleEmail('ali@gmail')).toBe(false);
    expect(isPlausibleEmail('ali.example.com')).toBe(false);
    expect(isPlausibleEmail('@example.com')).toBe(false);
    expect(isPlausibleEmail('ali @example.com')).toBe(false);
    expect(isPlausibleEmail('')).toBe(false);
  });
});
