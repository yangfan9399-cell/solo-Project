import { defineConfig } from 'vitest/config';
import { qwikVite } from '@builder.io/qwik/optimizer';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => {
  return {
    plugins: [qwikVite(), tsconfigPaths()],
    test: {
      globals: true,
      environment: 'node',
      include: ['src/**/*.{test,spec}.{js,ts}'],
    },
  };
});
