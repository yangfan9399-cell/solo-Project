/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leather: {
          50: "#faf6f1",
          100: "#f3ebe0",
          200: "#e6d5be",
          300: "#d6b994",
          400: "#c5976a",
          500: "#b77c4d",
          600: "#a8663f",
          700: "#8c5036",
          800: "#724232",
          900: "#5d372b",
        },
        bow: {
          DEFAULT: "#6b4226",
          dark: "#3d2516",
          light: "#9c6b47",
        },
        target: {
          gold: "#f5c518",
          red: "#e4002b",
          blue: "#0051a5",
          black: "#231f20",
          white: "#ffffff",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
