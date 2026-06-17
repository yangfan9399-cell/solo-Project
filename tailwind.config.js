/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/views/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/javascript/**/*.js",
    "./app/assets/stylesheets/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        disease: {
          flaking: "#ef4444",
          efflorescence: "#f59e0b",
          discoloration: "#8b5cf6",
          crack: "#3b82f6",
          other: "#6b7280"
        }
      }
    }
  },
  plugins: []
}
