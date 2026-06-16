import { getLevelById } from '~/data/gameData'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const levelId = Number(query.levelId)

  if (!levelId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing levelId parameter'
    })
  }

  const level = getLevelById(levelId)

  if (!level) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Level not found'
    })
  }

  return {
    level: {
      id: level.id,
      name: level.name,
      description: level.description,
      initialGold: level.initialGold,
      initialInventory: level.initialInventory,
      orders: level.orders,
      targetOrders: level.targetOrders,
      timeLimit: level.timeLimit,
      unlockRequirement: level.unlockRequirement
    }
  }
})
