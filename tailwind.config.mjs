/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b',
        },
        amber: {
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        tabular: ['DM Sans', 'font-variant-numeric: tabular-nums'],
      },
    },
  },
  plugins: [],
};
