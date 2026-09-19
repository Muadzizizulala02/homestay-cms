function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Getters, not eagerly-read constants: importing this module must never crash routes
// that don't need Cloudinary/ToyyibPay (e.g. /health, /admin/me) just because they aren't
// configured yet.
export const env = {
  get cloudinaryCloudName(): string {
    return requireEnv('CLOUDINARY_CLOUD_NAME');
  },
  get cloudinaryApiKey(): string {
    return requireEnv('CLOUDINARY_API_KEY');
  },
  get cloudinaryApiSecret(): string {
    return requireEnv('CLOUDINARY_API_SECRET');
  },
  /** Also used to compute/verify the callback hash — ToyyibPay has no separate signing key. */
  get toyyibpaySecretKey(): string {
    return requireEnv('TOYYIBPAY_SECRET_KEY');
  },
  get toyyibpayCategoryCode(): string {
    return requireEnv('TOYYIBPAY_CATEGORY_CODE');
  },
  /** No secret involved and a sensible default exists, so this one isn't required. */
  get toyyibpayBaseUrl(): string {
    return process.env['TOYYIBPAY_BASE_URL'] || 'https://dev.toyyibpay.com';
  },
  /** The deployed frontend origin — ToyyibPay redirects the guest back here after payment. */
  get frontendBaseUrl(): string {
    return requireEnv('FRONTEND_BASE_URL');
  },
  /** This backend's own public origin — ToyyibPay calls back here server-to-server. */
  get apiBaseUrl(): string {
    return requireEnv('API_BASE_URL');
  },
};
