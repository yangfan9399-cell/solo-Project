import { useDb } from '~/server/utils/db'

export default defineEventHandler(() => {
  const db = useDb()
  return db.all('levels').sort((a: any, b: any) => a.id - b.id).map((l: any) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    targetScore: l.targetScore,
    availableTelescopeIds: JSON.parse(l.availableTelescopeIds),
    availableFilterIds: JSON.parse(l.availableFilterIds),
    availableSkyRegionIds: JSON.parse(l.availableSkyRegionIds),
    totalObservationSlots: l.totalObservationSlots,
    cloudCoverageVariance: l.cloudCoverageVariance,
    moonPhaseVariance: l.moonPhaseVariance,
  }))
})
