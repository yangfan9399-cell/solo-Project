/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        tape: {
          bg: '#1a1612',
          panel: '#2a241e',
          border: '#4a3f35',
          accent: '#d4a84b',
          danger: '#c0392b',
          success: '#27ae60',
          text: '#e8dcc8',
          muted: '#8b7355',
        },
      },
      fontFamily: {
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
};
