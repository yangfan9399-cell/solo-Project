import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          50: "#fdfaf5",
          100: "#f9f1e3",
          200: "#f2e1c1",
          300: "#e8cc95",
          400: "#ddb366",
          500: "#d49a42",
          600: "#c68133",
          700: "#a5652c",
          800: "#85512b",
          900: "#6c4426",
        },
      },
      fontFamily: {
        hand: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
