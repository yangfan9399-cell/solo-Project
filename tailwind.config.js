/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        tide: {
          low: "#3B82F6",
          mid: "#06B6D4",
          high: "#8B5CF6",
        },
        eco: {
          good: "#10B981",
          warn: "#F59E0B",
          bad: "#EF4444",
        },
      },
      animation: {
        "wave": "wave 2s ease-in-out infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
