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
        primary: '#1e40af',
        'primary-light': '#3b82f6',
        secondary: '#0ea5e9',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#6366f1',
      },
    },
  },
  plugins: [],
} satisfies Config;
