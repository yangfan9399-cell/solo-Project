import type { AnswerRecord, Question } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { answers, questions }: { answers: AnswerRecord[]; questions: Question[] } = body

  let totalScore = 0
  answers.forEach(record => {
    if (!record.isCorrect) return

    const question = questions.find(q => q.id === record.questionId)
    if (!question) return

    const baseScore = 10
    const difficultyMultiplier = 1 + (question.difficulty - 1) * 0.2

    let timeBonus = 1
    if (record.timeSpent <= 5) {
      timeBonus = 2
    } else if (record.timeSpent <= 10) {
      timeBonus = 1.5
    } else if (record.timeSpent <= 20) {
      timeBonus = 1.2
    }

    totalScore += Math.round(baseScore * difficultyMultiplier * timeBonus)
  })

  const correctCount = answers.filter(a => a.isCorrect).length
  const wrongCount = answers.filter(a => !a.isCorrect).length

  return {
    success: true,
    data: {
      score: totalScore,
      correctCount,
      wrongCount,
      accuracy: Math.round((correctCount / questions.length) * 100)
    }
  }
})
