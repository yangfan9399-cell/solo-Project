/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          900: "#1e3a8a"
        },
        warning: {
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706"
        },
        danger: {
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626"
        },
        success: {
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a"
        }
      }
    }
  },
  plugins: []
};
