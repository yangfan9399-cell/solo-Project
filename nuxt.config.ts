// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-09-01',
  devtools: { enabled: true },
  pages: true,
  typescript: {
    strict: true,
    typeCheck: true
  }
})

