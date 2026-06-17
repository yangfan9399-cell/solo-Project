import { useGameStore } from '~/stores/gameStore'

export default defineNuxtPlugin(() => {
  const gameStore = useGameStore()
  gameStore.initPlayer()
})