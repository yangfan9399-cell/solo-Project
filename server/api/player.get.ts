import { getPlayer } from '~/utils/storage'

export default defineEventHandler(() => {
  const player = getPlayer()
  if (player) {
    return {
      success: true,
      data: player
    }
  }
  return {
    success: false,
    message: 'No player found'
  }
})
