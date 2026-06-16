export default defineNuxtConfig({
  devtools: { enabled: false },
  typescript: {
    strict: true,
    typeCheck: false
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: '古法染坊 - 配色经营游戏',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ]
    }
  },
  nitro: {
    storage: {
      'game-data': {
        driver: 'fs',
        base: './.data/game'
      }
    }
  }
})
