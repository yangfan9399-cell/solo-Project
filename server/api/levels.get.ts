import { levels } from '~/data/gameData'

export default defineEventHandler(() => {
  return {
    levels: levels.map(l => ({
      id: l.id,
      name: l.name,
      description: l.description,
      initialGold: l.initialGold,
      targetOrders: l.targetOrders,
      timeLimit: l.timeLimit,
      unlockRequirement: l.unlockRequirement,
      orderCount: l.orders.length
    }))
  }
})
