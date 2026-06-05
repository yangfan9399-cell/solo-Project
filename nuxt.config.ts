export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/hospital_supplies',
    public: {}
  }
})
