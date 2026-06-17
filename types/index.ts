export interface Player {
  id: string
  name: string
  level: number
  experience: number
  rank: string
  totalScore: number
  createdAt: string
  updatedAt: string
}

export interface Level {
  id: number
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  questions: Question[]
  requiredScore: number
  timeLimit: number
}

export interface Question {
  id: number
  type: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
  expression: string
  answer: number
  options?: number[]
  difficulty: number
}

export interface GameRecord {
  id: string
  playerId: string
  levelId: number
  score: number
  correctCount: number
  wrongCount: number
  timeUsed: number
  timestamp: string
  answers: AnswerRecord[]
}

export interface AnswerRecord {
  questionId: number
  playerAnswer: number
  correctAnswer: number
  isCorrect: boolean
  timeSpent: number
  errorType?: 'calculation' | 'carry' | 'borrow' | 'digit' | 'other'
}

export interface PracticePack {
  id: string
  name: string
  description: string
  questions: Question[]
  category: 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed' | 'memory'
}

export interface RankEntry {
  playerId: string
  playerName: string
  score: number
  level: number
  rank: string
}

export interface MemoryCard {
  id: number
  value: number
  position: number
  isRevealed: boolean
  isMatched: boolean
}

export interface OperationHistory {
  type: 'add' | 'subtract' | 'multiply' | 'divide' | 'undo' | 'redo'
  value: number
  timestamp: number
}

export type GameMode = 'challenge' | 'practice' | 'memory' | 'listen'
