import type { CorsOptions } from 'cors';

function normalise(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/**
 * Browser origins allowed to call the API: `ALLOWED_ORIGINS` (comma-separated) if set,
 * otherwise `FRONTEND_BASE_URL`. Empty if neither is configured.
 */
export function getAllowedOrigins(): string[] {
  const configured = process.env['ALLOWED_ORIGINS'] || process.env['FRONTEND_BASE_URL'] || '';
  return configured.split(',').map(normalise).filter(Boolean);
}

export function isOriginAllowed(origin: string | undefined): boolean {
  // Local emulator: `ng serve` runs on a different origin than the Functions emulator.
  if (process.env['FUNCTIONS_EMULATOR'] === 'true') {
    return true;
  }
  // No Origin header means a non-browser caller (the ToyyibPay callback, curl). CORS only
  // protects browsers; these callers are authenticated by their own means.
  if (!origin) {
    return true;
  }
  return getAllowedOrigins().includes(normalise(origin));
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
};
