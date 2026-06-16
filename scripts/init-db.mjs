import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
const dataFile = path.join(dataDir, 'db.json')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let db = {
  telescopes: [],
  filters: [],
  skyRegions: [],
  levels: [],
  playerProfiles: [],
  gameRuns: [],
  observationSlots: [],
  actionHistories: [],
  _counters: {
    telescopes: 0,
    filters: 0,
    skyRegions: 0,
    levels: 0,
    playerProfiles: 0,
    gameRuns: 0,
    observationSlots: 0,
    actionHistories: 0,
  },
}

function nextId(collection) {
  db._counters[collection] = (db._counters[collection] || 0) + 1
  return db._counters[collection]
}

if (fs.existsSync(dataFile)) {
  const raw = fs.readFileSync(dataFile, 'utf-8')
  try {
    const existing = JSON.parse(raw)
    if (existing.telescopes && existing.telescopes.length > 0) {
      console.log('✓ 数据库已存在，跳过初始化')
      console.log(`数据库位置: ${dataFile}`)
      process.exit(0)
    }
    db = { ...db, ...existing }
  } catch (e) {
    console.log('检测到损坏的数据库文件，重新初始化...')
  }
}

const telescopes = [
  { name: '小口径折射镜', aperture: 80, focalLength: 600, coolingTime: 0, maxObservationsPerNight: 99, description: '入门级设备，无需冷却，随时可用' },
  { name: '中口径牛顿式', aperture: 200, focalLength: 1000, coolingTime: 1, maxObservationsPerNight: 4, description: '性价比高，使用1次后需冷却1个时段' },
  { name: '大口径卡塞格林', aperture: 400, focalLength: 4000, coolingTime: 2, maxObservationsPerNight: 3, description: '专业级设备，观测后需冷却2个时段' },
  { name: '超级望远镜', aperture: 800, focalLength: 8000, coolingTime: 3, maxObservationsPerNight: 2, description: '顶级设备，观测能力极强，但冷却时间长' },
]

telescopes.forEach(t => {
  db.telescopes.push({ id: nextId('telescopes'), ...t })
})
console.log('✓ 望远镜数据已初始化')

const filters = [
  { name: '可见光滤镜', wavelength: '400-700nm', exposureMultiplier: 1.0, scienceValue: 1, description: '标准全光谱观测', color: '#ffffff' },
  { name: 'U波段紫外', wavelength: '320-400nm', exposureMultiplier: 1.5, scienceValue: 2, description: '紫外波段，适合研究热星', color: '#8b5cf6' },
  { name: 'B波段蓝光', wavelength: '400-480nm', exposureMultiplier: 1.2, scienceValue: 2, description: '蓝光波段，适合研究年轻恒星', color: '#3b82f6' },
  { name: 'V波段可见光', wavelength: '480-650nm', exposureMultiplier: 1.0, scienceValue: 2, description: '标准可见光波段', color: '#22c55e' },
  { name: 'R波段红光', wavelength: '650-750nm', exposureMultiplier: 0.8, scienceValue: 2, description: '红光波段，受大气影响小', color: '#ef4444' },
  { name: 'I波段近红外', wavelength: '750-900nm', exposureMultiplier: 0.7, scienceValue: 3, description: '近红外波段，穿透尘埃能力强', color: '#f97316' },
  { name: 'H-alpha氢线', wavelength: '656.3nm', exposureMultiplier: 2.0, scienceValue: 4, description: '氢原子发射线，适合研究星云', color: '#ec4899' },
]

filters.forEach(f => {
  db.filters.push({ id: nextId('filters'), ...f })
})
console.log('✓ 滤镜数据已初始化')

const skyRegions = [
  { name: '猎户座大星云', declination: -5.4, bestSeason: '冬季', difficulty: 1, basePoints: 100, description: '最亮的弥散星云之一，易于观测' },
  { name: '仙女座星系', declination: 41.3, bestSeason: '秋季', difficulty: 1, basePoints: 120, description: '距离银河系最近的大型星系' },
  { name: '蟹状星云', declination: 22.0, bestSeason: '冬季', difficulty: 2, basePoints: 180, description: '著名的超新星遗迹，脉动力星云' },
  { name: '玫瑰星云', declination: 11.0, bestSeason: '冬季', difficulty: 2, basePoints: 200, description: '位于麒麟座的大型发射星云' },
  { name: '马头星云', declination: -2.4, bestSeason: '冬季', difficulty: 3, basePoints: 280, description: '猎户座的著名暗星云' },
  { name: '鹰状星云', declination: -13.8, bestSeason: '夏季', difficulty: 3, basePoints: 300, description: '包含"创生之柱"的恒星形成区' },
  { name: '环状星云', declination: 33.0, bestSeason: '夏季', difficulty: 3, basePoints: 320, description: '最著名的行星状星云' },
  { name: '船底座星云', declination: -60.0, bestSeason: '夏季', difficulty: 4, basePoints: 450, description: '南天最壮观的弥漫星云' },
]

skyRegions.forEach(s => {
  db.skyRegions.push({ id: nextId('skyRegions'), ...s })
})
console.log('✓ 天区数据已初始化')

const levels = [
  {
    name: '新手观测员',
    description: '熟悉天文台的基本操作，完成第一次夜间观测',
    targetScore: 200,
    availableTelescopeIds: JSON.stringify([1, 2]),
    availableFilterIds: JSON.stringify([1, 4, 5]),
    availableSkyRegionIds: JSON.stringify([1, 2]),
    totalObservationSlots: 4,
    cloudCoverageVariance: 0.2,
    moonPhaseVariance: 0.3,
  },
  {
    name: '进阶观测',
    description: '尝试多种滤镜组合，挑战稍难的目标',
    targetScore: 600,
    availableTelescopeIds: JSON.stringify([1, 2, 3]),
    availableFilterIds: JSON.stringify([1, 2, 3, 4, 5]),
    availableSkyRegionIds: JSON.stringify([1, 2, 3, 4]),
    totalObservationSlots: 5,
    cloudCoverageVariance: 0.35,
    moonPhaseVariance: 0.4,
  },
  {
    name: '深空探索',
    description: '使用专业设备冲击深空天体',
    targetScore: 1200,
    availableTelescopeIds: JSON.stringify([2, 3, 4]),
    availableFilterIds: JSON.stringify([3, 4, 5, 6, 7]),
    availableSkyRegionIds: JSON.stringify([3, 4, 5, 6, 7]),
    totalObservationSlots: 6,
    cloudCoverageVariance: 0.45,
    moonPhaseVariance: 0.5,
  },
  {
    name: '大师班',
    description: '在恶劣天气条件下完成极限观测',
    targetScore: 2000,
    availableTelescopeIds: JSON.stringify([3, 4]),
    availableFilterIds: JSON.stringify([5, 6, 7]),
    availableSkyRegionIds: JSON.stringify([5, 6, 7, 8]),
    totalObservationSlots: 7,
    cloudCoverageVariance: 0.6,
    moonPhaseVariance: 0.7,
  },
]

levels.forEach(l => {
  db.levels.push({ id: nextId('levels'), ...l })
})
console.log('✓ 关卡数据已初始化')

const now = new Date().toISOString()
db.playerProfiles.push({
  id: nextId('playerProfiles'),
  name: '默认观测员',
  totalScore: 0,
  highestLevel: 1,
  completedRuns: 0,
  createdAt: now,
  updatedAt: now,
})
console.log('✓ 默认玩家档案已初始化')

fs.writeFileSync(dataFile, JSON.stringify(db, null, 2), 'utf-8')

console.log('\n🎉 数据库初始化完成！')
console.log(`数据库位置: ${dataFile}`)
