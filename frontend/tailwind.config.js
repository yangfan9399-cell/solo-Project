/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        antique: {
          50: '#fdf8f3',
          100: '#f9ebe0',
          200: '#f2d5bc',
          300: '#e9b98f',
          400: '#de965d',
          500: '#d67a3a',
          600: '#c8632e',
          700: '#a74c27',
          800: '#863e26',
          900: '#6d3421',
        },
        disease: {
          acid: '#f59e0b',
          moth: '#84cc16',
          mold: '#14b8a6',
          tear: '#ef4444',
          stain: '#6366f1',
          brittle: '#a855f7',
        },
        severity: {
          mild: '#22c55e',
          moderate: '#eab308',
          severe: '#f97316',
          critical: '#ef4444',
        },
      },
    },
  },
  plugins: [],
};
