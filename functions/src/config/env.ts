function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Getters, not eagerly-read constants: importing this module must never crash routes
// that don't need Cloudinary/Billplz (e.g. /health, /admin/me) just because they aren't
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
  get billplzSecretKey(): string {
    return requireEnv('BILLPLZ_SECRET_KEY');
  },
  get billplzCollectionId(): string {
    return requireEnv('BILLPLZ_COLLECTION_ID');
  },
  get billplzXSignatureKey(): string {
    return requireEnv('BILLPLZ_X_SIGNATURE_KEY');
  },
  /** No secret involved and a sensible default exists, so this one isn't required. */
  get billplzBaseUrl(): string {
    return process.env['BILLPLZ_BASE_URL'] || 'https://www.billplz-sandbox.com';
  },
  /** The deployed frontend origin — Billplz redirects the guest back here after payment. */
  get frontendBaseUrl(): string {
    return requireEnv('FRONTEND_BASE_URL');
  },
  /** This backend's own public origin — Billplz calls back here server-to-server. */
  get apiBaseUrl(): string {
    return requireEnv('API_BASE_URL');
  },
};
