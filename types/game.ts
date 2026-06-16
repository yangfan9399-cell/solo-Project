export interface RGB {
  r: number
  g: number
  b: number
}

export interface Dye {
  id: string
  name: string
  color: RGB
  basePrice: number
  description: string
}

export interface InventoryItem {
  dyeId: string
  quantity: number
}

export interface Order {
  id: string
  name: string
  customer: string
  targetColor: RGB
  reward: number
  deadline: number
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
}

export interface DyeAction {
  id: string
  type: 'mix' | 'heat' | 'cool' | 'dip' | 'rinse'
  timestamp: number
  details: Record<string, any>
}

export interface DyeingSession {
  id: string
  orderId: string
  orderName?: string
  targetColor?: RGB
  currentColor: RGB
  finalColor?: RGB
  temperature: number
  dipCount: number
  totalDipTime: number
  actions: DyeAction[]
  dyeUsed: Record<string, number>
  operationHistory?: OperationHistory[]
  result?: DyeResult
  reward?: number
  startTime: number
  endTime?: number
  status: 'active' | 'completed' | 'failed' | 'cancelled'
}

export interface Level {
  id: number
  name: string
  description: string
  initialGold: number
  initialInventory: InventoryItem[]
  orders: Order[]
  targetOrders: number
  timeLimit: number
  unlockRequirement: number
}

export interface PlayerProfile {
  id: string
  name: string
  gold: number
  totalScore: number
  currentLevel: number
  unlockedLevels: number[]
  inventory: InventoryItem[]
  createdAt: number
  lastPlayed: number
}

export interface GameRecord {
  id: string
  playerId: string
  levelId: number
  score: number
  goldEarned: number
  ordersCompleted: number
  ordersFailed: number
  ordersCancelled?: number
  totalColorDiff: number
  startTime: number
  endTime: number
  status: 'completed' | 'failed' | 'quit'
  dyeingSessions: DyeingSession[]
}

export interface OperationHistory {
  id: string
  sessionId: string
  action: DyeAction
  stateBefore: {
    color: RGB
    temperature: number
  }
  stateAfter: {
    color: RGB
    temperature: number
  }
  timestamp: number
}

export interface DyeResult {
  finalColor: RGB
  colorDiff: number
  score: number
  quality: 'perfect' | 'good' | 'fair' | 'poor'
  rewardMultiplier: number
}

export interface GameReport {
  totalOrders: number
  completedOrders: number
  failedOrders: number
  totalRevenue: number
  totalCost: number
  profit: number
  avgColorDiff: number
  perfectCount: number
  goodCount: number
  fairCount: number
  poorCount: number
}
