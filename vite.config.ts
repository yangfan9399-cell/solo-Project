import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [qwikCity(), qwikVite()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=600',
    },
  },
});
