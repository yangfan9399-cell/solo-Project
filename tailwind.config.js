/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'deep-sea': {
          50: '#E6ECF3',
          100: '#C2CFE0',
          200: '#9AAFC9',
          300: '#718FB2',
          400: '#5276A0',
          500: '#335E8E',
          600: '#254870',
          700: '#183353',
          800: '#0F2440',
          900: '#0A1628',
          950: '#060D18',
        },
        'industrial-copper': {
          50: '#FAF3EC',
          100: '#F2DFCB',
          200: '#E8C8A3',
          300: '#DEB07A',
          400: '#D59A58',
          500: '#CB8336',
          600: '#B87333',
          700: '#8E5927',
          800: '#643F1B',
          900: '#3A250F',
        },
        'alert-red': {
          500: '#D64545',
          600: '#B93636',
          700: '#922727',
        },
        'safety-green': {
          500: '#2E8B57',
          600: '#246D45',
          700: '#1A4F33',
        },
        'warn-orange': {
          500: '#E67E22',
          600: '#C56517',
          700: '#A04E0F',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-copper': '0 0 12px rgba(184, 115, 51, 0.4)',
        'glow-red': '0 0 12px rgba(214, 69, 69, 0.5)',
        'glow-green': '0 0 12px rgba(46, 139, 87, 0.4)',
        'panel': '0 2px 16px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(184, 115, 51, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(184, 115, 51, 0.06) 1px, transparent 1px)",
      },
      animation: {
        'pulse-breath': 'pulse-breath 2s ease-in-out infinite',
        'slide-in': 'slide-in 200ms ease-out',
      },
      keyframes: {
        'pulse-breath': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(214, 69, 69, 0.5)' },
          '50%': { boxShadow: '0 0 0 6px rgba(214, 69, 69, 0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
