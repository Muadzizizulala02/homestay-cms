/**
 * A deliberately loose email check, only to catch obvious typos (a missing "@" or a domain with
 * no dot, like "ali@gmail") before the booking is submitted. The server remains the authority.
 */
export function isPlausibleEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}
