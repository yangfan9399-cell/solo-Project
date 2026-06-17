import type { Question, AnswerRecord, GameRecord, Level } from '~/types'

export function calculateScore(answerRecord: AnswerRecord, difficulty: number): number {
  if (!answerRecord.isCorrect) return 0
  
  const baseScore = 10
  const difficultyMultiplier = 1 + (difficulty - 1) * 0.2
  
  let timeBonus = 1
  if (answerRecord.timeSpent <= 5) {
    timeBonus = 2
  } else if (answerRecord.timeSpent <= 10) {
    timeBonus = 1.5
  } else if (answerRecord.timeSpent <= 20) {
    timeBonus = 1.2
  }
  
  return Math.round(baseScore * difficultyMultiplier * timeBonus)
}

export function calculateTotalScore(records: AnswerRecord[], questions: Question[]): number {
  let total = 0
  records.forEach(record => {
    const question = questions.find(q => q.id === record.questionId)
    if (question) {
      total += calculateScore(record, question.difficulty)
    }
  })
  return total
}

export function analyzeErrorType(playerAnswer: number, correctAnswer: number): AnswerRecord['errorType'] {
  const playerStr = String(Math.abs(playerAnswer))
  const correctStr = String(Math.abs(correctAnswer))
  
  if (playerStr.length !== correctStr.length) {
    return 'digit'
  }
  
  const diff = Math.abs(playerAnswer - correctAnswer)
  
  if (diff >= 10 && diff < 100 && diff % 10 === 0) {
    return 'carry'
  }
  
  if (diff >= 10 && diff < 100) {
    return 'borrow'
  }
  
  return 'calculation'
}

export function generateGameRecord(
  playerId: string,
  levelId: number,
  answers: AnswerRecord[],
  timeUsed: number,
  questions: Question[],
  operationHistory: OperationHistory[] = []
): GameRecord {
  const correctCount = answers.filter(a => a.isCorrect).length
  const wrongCount = answers.filter(a => !a.isCorrect).length
  const score = calculateTotalScore(answers, questions)
  
  return {
    id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    playerId,
    levelId,
    score,
    correctCount,
    wrongCount,
    timeUsed,
    timestamp: new Date().toISOString(),
    answers,
    operationHistory
  }
}

export function isLevelPassed(score: number, level: Level): boolean {
  return score >= level.requiredScore
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generateMemoryCards(count: number = 8): { value: number; id: number; position: number }[] {
  const values = Array.from({ length: count / 2 }, (_, i) => i + 1)
  const pairs = [...values, ...values]
  const shuffled = shuffleArray(pairs)
  
  return shuffled.map((value, index) => ({
    value,
    id: index + 1,
    position: index
  }))
}

export function generateListenQuestions(count: number = 5): Question[] {
  const questions: Question[] = []
  
  for (let i = 0; i < count; i++) {
    const types: Question['type'][] = ['addition', 'subtraction', 'multiplication', 'division']
    const type = types[Math.floor(Math.random() * types.length)]
    
    let expression = ''
    let answer = 0
    
    switch (type) {
      case 'addition': {
        const a = Math.floor(Math.random() * 50) + 10
        const b = Math.floor(Math.random() * 50) + 10
        expression = `${a} + ${b}`
        answer = a + b
        break
      }
      case 'subtraction': {
        const a = Math.floor(Math.random() * 50) + 20
        const b = Math.floor(Math.random() * (a - 10)) + 10
        expression = `${a} - ${b}`
        answer = a - b
        break
      }
      case 'multiplication': {
        const a = Math.floor(Math.random() * 9) + 2
        const b = Math.floor(Math.random() * 9) + 2
        expression = `${a} × ${b}`
        answer = a * b
        break
      }
      case 'division': {
        const b = Math.floor(Math.random() * 9) + 2
        const answerTemp = Math.floor(Math.random() * 9) + 2
        const a = b * answerTemp
        expression = `${a} ÷ ${b}`
        answer = answerTemp
        break
      }
    }
    
    questions.push({
      id: Date.now() + i,
      type,
      expression,
      answer,
      difficulty: 2
    })
  }
  
  return questions
}
