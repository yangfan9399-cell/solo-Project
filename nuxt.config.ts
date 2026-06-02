export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  nitro: {
    plugins: ['~/server/plugins/database.ts']
  },
  typescript: {
    strict: true,
    typeCheck: true
  }
})
