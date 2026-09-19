import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./src/test/emulator-setup.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
