/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ancient': {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d7b9',
          300: '#e9ba87',
          400: '#df9753',
          500: '#d77b30',
          600: '#c56126',
          700: '#a34a21',
          800: '#833c22',
          900: '#6a331f',
          950: '#39180e',
        },
        'jade': {
          50: '#f2fbf6',
          100: '#e1f6e9',
          200: '#c5ecd4',
          300: '#98dbb6',
          400: '#66c291',
          500: '#43a774',
          600: '#31885c',
          700: '#296d4c',
          800: '#24573f',
          900: '#1f4835',
          950: '#0e281c',
        },
        'cinnabar': {
          50: '#fef3f2',
          100: '#ffe4e1',
          200: '#ffcdc6',
          300: '#fea99e',
          400: '#fa7a68',
          500: '#f24d35',
          600: '#e03218',
          700: '#bc2510',
          800: '#9b2212',
          900: '#812316',
          950: '#460c07',
        }
      },
      fontFamily: {
        'serif-cn': ['"Noto Serif SC"', 'STSong', 'SimSun', 'serif'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'crack-pulse': 'crackPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        crackPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
