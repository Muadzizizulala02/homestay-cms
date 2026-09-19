function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Getters, not eagerly-read constants: importing this module must never crash routes
// that don't need Cloudinary (e.g. /health, /admin/me) just because it isn't configured yet.
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
};
