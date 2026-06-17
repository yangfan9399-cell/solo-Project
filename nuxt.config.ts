export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  typescript: {
    strict: true,
    parserOptions: {
      parser: 'babel-eslint'
    }
  },
  experimental: {
    parserOptions: {
      parser: 'babel-eslint'
    }
  },
  app: {
    head: {
      title: '算盘心算闯关训练游戏',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '算盘心算闯关训练游戏，提升心算能力' }
      ]
    }
  }
})
