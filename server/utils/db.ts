import fs from 'fs'
import path from 'path'

export interface DbData {
  telescopes: any[]
  filters: any[]
  skyRegions: any[]
  levels: any[]
  playerProfiles: any[]
  gameRuns: any[]
  observationSlots: any[]
  actionHistories: any[]
  _counters: {
    telescopes: number
    filters: number
    skyRegions: number
    levels: number
    playerProfiles: number
    gameRuns: number
    observationSlots: number
    actionHistories: number
  }
}

let _cache: DbData | null = null
let _dataFile: string = ''

function getDataDir(): string {
  const dir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

function getDataFile(): string {
  if (!_dataFile) {
    _dataFile = path.join(getDataDir(), 'db.json')
  }
  return _dataFile
}

function emptyDb(): DbData {
  return {
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
}

export function loadDb(): DbData {
  if (_cache) return _cache
  const file = getDataFile()
  if (!fs.existsSync(file)) {
    _cache = emptyDb()
    saveDb(_cache)
    return _cache
  }
  try {
    const raw = fs.readFileSync(file, 'utf-8')
    _cache = JSON.parse(raw) as DbData
    if (!_cache._counters) {
      _cache._counters = emptyDb()._counters
    }
    return _cache
  } catch (e) {
    _cache = emptyDb()
    saveDb(_cache)
    return _cache
  }
}

export function saveDb(db: DbData): void {
  _cache = db
  const file = getDataFile()
  fs.writeFileSync(file, JSON.stringify(db, null, 2), 'utf-8')
}

export function nextId(db: DbData, collection: keyof DbData['_counters']): number {
  db._counters[collection] = (db._counters[collection] || 0) + 1
  return db._counters[collection]
}

export function resetDb(): void {
  _cache = null
  const file = getDataFile()
  if (fs.existsSync(file)) {
    fs.unlinkSync(file)
  }
}

export function useDb() {
  return {
    all(collection: keyof Omit<DbData, '_counters'>) {
      const db = loadDb()
      return [...(db[collection] as any[])]
    },
    find(collection: keyof Omit<DbData, '_counters'>, predicate: (item: any) => boolean) {
      const db = loadDb()
      return (db[collection] as any[]).find(predicate)
    },
    filter(collection: keyof Omit<DbData, '_counters'>, predicate: (item: any) => boolean) {
      const db = loadDb()
      return (db[collection] as any[]).filter(predicate)
    },
    insert(collection: keyof Omit<DbData, '_counters'>, item: any): any {
      const db = loadDb()
      const id = nextId(db, collection as any)
      const newItem = { id, ...item }
      ;(db[collection] as any[]).push(newItem)
      saveDb(db)
      return newItem
    },
    update(collection: keyof Omit<DbData, '_counters'>, id: number, updates: any): any | null {
      const db = loadDb()
      const list = db[collection] as any[]
      const idx = list.findIndex((x: any) => x.id === id)
      if (idx < 0) return null
      list[idx] = { ...list[idx], ...updates }
      saveDb(db)
      return list[idx]
    },
    updateWhere(collection: keyof Omit<DbData, '_counters'>, predicate: (item: any) => boolean, updates: any): number {
      const db = loadDb()
      const list = db[collection] as any[]
      let count = 0
      for (let i = 0; i < list.length; i++) {
        if (predicate(list[i])) {
          list[i] = { ...list[i], ...updates }
          count++
        }
      }
      if (count > 0) saveDb(db)
      return count
    },
    transaction<T>(fn: () => T): T {
      return fn()
    },
  }
}
