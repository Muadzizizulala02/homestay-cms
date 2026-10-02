/**
 * A safe CSS `url("...")` value for a background image, or null when there is no image. Quotes,
 * backslashes and line breaks in the address are escaped so a stray character can never break out
 * of the url() and inject other CSS.
 */
export function cssUrl(address: string | null | undefined): string | null {
  const value = (address ?? '').trim();
  if (!value) {
    return null;
  }
  const escaped = value.replace(/[\\"]/g, (c) => encodeURIComponent(c)).replace(/[\r\n]/g, '');
  return `url("${escaped}")`;
}
