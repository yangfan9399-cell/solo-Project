import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        customs: {
          50: "#f0f7ff",
          100: "#e0efff",
          200: "#bae0fd",
          300: "#7cc9fb",
          400: "#36aaf6",
          500: "#0c8ee7",
          600: "#0071c5",
          700: "#015aa0",
          800: "#064d83",
          900: "#0b416d",
          950: "#072a48",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
