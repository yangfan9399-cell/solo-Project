import { defineConfig } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import { staticAdapter } from '@builder.io/qwik-city/adapters/static/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [qwikCity(), qwikVite(), staticAdapter({ origin: 'http://localhost:5173/' })],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '../../src'),
    },
  },
});
