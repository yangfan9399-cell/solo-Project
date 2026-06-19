/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#fafaf7',
          100: '#f3f2eb',
          200: '#e6e3d3',
          300: '#d4cfb6',
          400: '#b8b18c',
          500: '#9c936b',
          600: '#837a58',
          700: '#696248',
          800: '#57513e',
          900: '#4a4536',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36aaf6',
          500: '#0c8de5',
          600: '#006fc3',
          700: '#01599e',
          800: '#064c82',
          900: '#0b406b',
        }
      }
    }
  },
  plugins: []
}
