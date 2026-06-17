/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
        defect: { crack: "#ef4444", deposit: "#f59e0b", misalign: "#8b5cf6", leak: "#3b82f6", corrosion: "#f97316", disjoint: "#ec4899", branch: "#14b8a6", deform: "#6366f1" },
      },
    },
  },
  plugins: [],
};
