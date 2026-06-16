import { dyes } from '~/data/gameData'

export default defineEventHandler(() => {
  return {
    dyes: dyes.map(d => ({
      id: d.id,
      name: d.name,
      color: d.color,
      basePrice: d.basePrice,
      description: d.description
    }))
  }
})
