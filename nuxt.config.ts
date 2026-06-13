export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '医院耗材高值领用植入登记与追溯复核系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/consumable_trace',
    public: {
      appName: '高值耗材追溯系统',
      version: '1.0.0'
    }
  },
  nitro: {
    compatibilityDate: '2024-04-03'
  }
})
