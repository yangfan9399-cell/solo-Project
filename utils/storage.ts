import type { Player, GameRecord, RankEntry } from '~/types'

const STORAGE_KEYS = {
  PLAYER: 'abacus_player',
  GAME_RECORDS: 'abacus_game_records',
  RANKING: 'abacus_ranking'
}

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined'

function getStorageItem(key: string): string | null {
  if (!isBrowser) return null
  return localStorage.getItem(key)
}

function setStorageItem(key: string, value: string): void {
  if (!isBrowser) return
  localStorage.setItem(key, value)
}

function removeStorageItem(key: string): void {
  if (!isBrowser) return
  localStorage.removeItem(key)
}

export function savePlayer(player: Player): void {
  setStorageItem(STORAGE_KEYS.PLAYER, JSON.stringify(player))
}

export function getPlayer(): Player | null {
  const data = getStorageItem(STORAGE_KEYS.PLAYER)
  return data ? JSON.parse(data) : null
}

export function createPlayer(name: string): Player {
  const now = new Date().toISOString()
  const player: Player = {
    id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    level: 1,
    experience: 0,
    rank: '初学者',
    totalScore: 0,
    createdAt: now,
    updatedAt: now
  }
  savePlayer(player)
  return player
}

export function saveGameRecord(record: GameRecord): void {
  const records = getGameRecords()
  records.push(record)
  setStorageItem(STORAGE_KEYS.GAME_RECORDS, JSON.stringify(records))
}

export function getGameRecords(): GameRecord[] {
  const data = getStorageItem(STORAGE_KEYS.GAME_RECORDS)
  return data ? JSON.parse(data) : []
}

export function getGameRecordsByPlayer(playerId: string): GameRecord[] {
  return getGameRecords().filter(r => r.playerId === playerId)
}

export function getGameRecordsByLevel(levelId: number): GameRecord[] {
  return getGameRecords().filter(r => r.levelId === levelId)
}

export function updatePlayerStats(player: Player, score: number, levelId: number): Player {
  const baseExp = score * 10
  const levelBonus = levelId * 50
  player.experience += baseExp + levelBonus
  player.totalScore += score
  
  const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600]
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (player.experience >= levelThresholds[i]) {
      player.level = i + 1
      break
    }
  }
  
  const ranks = ['初学者', '入门级', '初级', '中级', '高级', '专家', '大师', '宗师', '传奇']
  player.rank = ranks[Math.min(player.level - 1, ranks.length - 1)]
  
  player.updatedAt = new Date().toISOString()
  savePlayer(player)
  
  updateRanking(player)
  
  return player
}

export function getRanking(): RankEntry[] {
  const data = getStorageItem(STORAGE_KEYS.RANKING)
  return data ? JSON.parse(data) : []
}

export function updateRanking(player: Player): void {
  const ranking = getRanking()
  const existingIndex = ranking.findIndex(r => r.playerId === player.id)
  
  const entry: RankEntry = {
    playerId: player.id,
    playerName: player.name,
    score: player.totalScore,
    level: player.level,
    rank: player.rank
  }
  
  if (existingIndex >= 0) {
    ranking[existingIndex] = entry
  } else {
    ranking.push(entry)
  }
  
  ranking.sort((a, b) => b.score - a.score)
  
  setStorageItem(STORAGE_KEYS.RANKING, JSON.stringify(ranking.slice(0, 100)))
}

export function clearAllData(): void {
  removeStorageItem(STORAGE_KEYS.PLAYER)
  removeStorageItem(STORAGE_KEYS.GAME_RECORDS)
  removeStorageItem(STORAGE_KEYS.RANKING)
}