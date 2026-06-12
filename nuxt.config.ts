export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/pump_station',
    public: {
      apiBase: '/api'
    }
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '城市排水泵站值守告警处置与交接复核系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  }
})
