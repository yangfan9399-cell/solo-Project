import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'node:path';

export default defineConfig(() => {
  return {
    resolve: {
      alias: {
        sharp: path.resolve('./src/mocks/sharp.ts'),
        'imagetools-core': path.resolve('./src/mocks/imagetools-core.ts'),
      },
    },
    plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
    preview: {
      headers: {
        'Cache-Control': 'public, max-age=600',
      },
    },
    ssr: {
      noExternal: [],
      external: [],
    },
    build: {
      target: 'es2020',
    },
    optimizeDeps: {
      include: [],
      exclude: [],
    },
    server: {
      fs: {
        allow: ['.'],
      },
    },
  };
});
